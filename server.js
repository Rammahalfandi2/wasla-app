const express = require("express");
const db = require("./db");
const app = express();
const PORT = 3000;
const COMMISSION_RATE = 0.12; // نسبة عمولة وصلة من كل رحلة (12%)

app.use(express.json());
app.use(express.static("public"));

// ------- السائقون -------

app.get("/api/drivers", (req, res) => {
  res.json(db.get("drivers").value());
});

app.post("/api/drivers", (req, res) => {
  const newDriver = {
    id: Date.now().toString(),
    name: req.body.name,
    car: req.body.car,
    online: false,
    wallet: 30000, // نبدأ كل سائق برصيد تجريبي بسيط
    trips: 0,
    currentTripId: null
  };
  db.get("drivers").push(newDriver).write();
  res.json(newDriver);
});

app.patch("/api/drivers/:id/online", (req, res) => {
  const driver = db.get("drivers").find({ id: req.params.id }).value();
  if (!driver) return res.status(404).json({ error: "السائق غير موجود" });
  db.get("drivers").find({ id: req.params.id }).assign({ online: req.body.online }).write();
  res.json({ success: true });
});

// ------- الرحلات -------

function estimateDistance(pickup, dropoff) {
  if (pickup === dropoff) return 1.5;
  let hash = 0;
  const s = pickup + dropoff;
  for (let i = 0; i < s.length; i++) hash = (hash * 31 + s.charCodeAt(i)) % 977;
  return Math.round((2 + (hash % 1200) / 100) * 10) / 10;
}
function computeFare(km) {
  const base = 4000, perKm = 1200;
  return Math.round((base + km * perKm) / 500) * 500;
}

app.post("/api/trips", (req, res) => {
  const { pickup, dropoff, riderName, payment } = req.body;
  const distanceKm = estimateDistance(pickup, dropoff);
  const fare = computeFare(distanceKm);
  const commission = Math.round(fare * COMMISSION_RATE);

  const availableDriver = db.get("drivers")
    .find({ online: true, currentTripId: null })
    .value();

  const trip = {
    id: Date.now().toString(),
    riderName: riderName || "راكب تجريبي",
    pickup, dropoff, distanceKm, fare, commission,
    payment: payment || "cash",
    driverId: availableDriver ? availableDriver.id : null,
    status: availableDriver ? "assigned" : "no_driver",
    createdAt: Date.now()
  };

  db.get("trips").push(trip).write();

  if (availableDriver) {
    db.get("drivers").find({ id: availableDriver.id }).assign({ currentTripId: trip.id }).write();
  }

  res.json(trip);
});

app.get("/api/trips", (req, res) => {
  res.json(db.get("trips").value());
});

app.patch("/api/trips/:id/status", (req, res) => {
  const trip = db.get("trips").find({ id: req.params.id }).value();
  if (!trip) return res.status(404).json({ error: "الرحلة غير موجودة" });

  db.get("trips").find({ id: req.params.id }).assign({ status: req.body.status }).write();

  // لما تنتهي الرحلة: نخصم العمولة من محفظة السائق، ونحرره لرحلة جديدة
  if (req.body.status === "completed" && trip.driverId) {
    const driver = db.get("drivers").find({ id: trip.driverId }).value();
    db.get("drivers").find({ id: trip.driverId }).assign({
      currentTripId: null,
      wallet: driver.wallet - trip.commission,
      trips: (driver.trips || 0) + 1
    }).write();
  }

  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`الخادم شغّال الآن على: http://localhost:${PORT}`);
});