
// ========================================
// SALA — MYSQL DATABASE CONNECTION
// ========================================

const mysql = require("mysql2");


// ========================================
// CREATE DATABASE CONNECTION
// ========================================

const db = mysql.createConnection({

    host: "localhost",

    user: "root",

    password: "",

    database: "sala_restaurant"

});


// ========================================
// CONNECT TO MYSQL
// ========================================

db.connect((error) => {

    if (error) {

        console.error(
            "MySQL connection failed:",
            error.message
        );

        return;

    }

    console.log(
        "Connected to MySQL database!"
    );

});


// ========================================
// EXPORT DATABASE CONNECTION
// ========================================

module.exports = db;
