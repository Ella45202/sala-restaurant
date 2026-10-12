
const mysql = require("mysql2");

const db = mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "sala_restaurant",
    port: Number(process.env.DB_PORT) || 3306
});

db.connect((error) => {
    if (error) {
        console.error("MySQL connection failed:", error.message);
        return;
    }

    console.log("Connected to MySQL database!");
});

module.exports = db;
