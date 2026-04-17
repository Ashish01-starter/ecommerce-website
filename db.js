const mysql = require('mysql2');

// Create connection
const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",   // add your MySQL password if any
    database: "ecommerce"
});

// Connect to DB
db.connect((err) => {
    if (err) {
        console.error("Database connection failed:", err);
    } else {
        console.log("Connected to MySQL database");
    }
});

module.exports = db;