var mysql = require("mysql");
var db = mysql.createConnection(JSON.parse(process.env.DB_CONFIG));
db.connect();
module.exports = db;
