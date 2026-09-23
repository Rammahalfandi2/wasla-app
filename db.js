// هذا ملف قاعدة البيانات
// وظيفته: يفتح ملف اسمه data.json ويحفظ فيه كل بيانات التطبيق

const low = require("lowdb");
const FileSync = require("lowdb/adapters/FileSync");

const adapter = new FileSync("data.json"); // اسم الملف اللي رح تنحفظ فيه البيانات
const db = low(adapter);

// لو الملف فاضي (أول مرة)، نحط فيه هيكلية ابتدائية:
// درايفرز (سائقين) - رايدرز (ركاب) - تريبس (رحلات)
db.defaults({ drivers: [], riders: [], trips: [] }).write();

module.exports = db;