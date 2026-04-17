const express = require('express');
const cors = require('cors');
const db = require('./db');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const ALLOWED_TABLES = [
    'BUYER', 'EMPLOYEE', 'MANAGES',
    'PRODUCT', 'PURCHASES', 'SELLER',
    'TRANSACTIONS'
];

/* =========================
   HELPER (NO MAPPING NOW)
========================= */
function getRealTable(table) {
    return table; // ✅ DB and API names now match
}

/* =========================
   GET TABLE SCHEMA
========================= */
app.get('/api/schema/:table', (req, res) => {
    const table = req.params.table.toUpperCase();

    if (!ALLOWED_TABLES.includes(table)) {
        return res.status(400).json({ error: 'Invalid table' });
    }

    const query = `
        SELECT COLUMN_NAME, DATA_TYPE
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = ?
    `;

    db.query(query, [table], (err, result) => {
        if (err) {
            console.error("Schema Error:", err);
            return res.status(500).json({ error: err.message, full: err });
        }
        res.json(result);
    });
});

/* =========================
   GET ALL RECORDS
========================= */
app.get('/api/:table', (req, res) => {
    const table = req.params.table.toUpperCase();

    if (!ALLOWED_TABLES.includes(table)) {
        return res.status(400).json({ error: 'Invalid table' });
    }

    const query = `SELECT * FROM \`${table}\``;

    db.query(query, (err, result) => {
        if (err) {
            console.error("Fetch Error:", err);
            return res.status(500).json({ error: err.message, full: err });
        }
        res.json(result);
    });
});

/* =========================
   LOOKUP
========================= */
app.get('/api/lookup/:parentTable', (req, res) => {
    const table = req.params.parentTable.toUpperCase();

    if (!ALLOWED_TABLES.includes(table)) {
        return res.status(400).json({ error: 'Invalid table' });
    }

    let pkCol =
        table === 'TRANSACTIONS' ? 'TXNID' :
        table === 'PRODUCT' ? 'PRODUCTID' :
        table === 'BUYER' ? 'BUYERID' :
        table === 'SELLER' ? 'SELLERID' :
        table === 'EMPLOYEE' ? 'EMPID' : null;

    if (!pkCol) {
        return res.status(400).json({ error: 'Lookup not supported' });
    }

    const query = `SELECT ${pkCol} AS ID FROM \`${table}\``;

    db.query(query, (err, result) => {
        if (err) {
            console.error("Lookup Error:", err);
            return res.status(500).json({ error: err.message, full: err });
        }
        res.json(result);
    });
});

/* =========================
   INSERT
========================= */
app.post('/api/:table', (req, res) => {
    const table = req.params.table.toUpperCase();

    if (!ALLOWED_TABLES.includes(table)) {
        return res.status(400).json({ error: 'Invalid table' });
    }

    const data = req.body;
    const columns = Object.keys(data);
    const values = Object.values(data);

    const placeholders = columns.map(() => '?').join(', ');

    const query = `INSERT INTO \`${table}\` (${columns.join(', ')}) VALUES (${placeholders})`;

    db.query(query, values, (err, result) => {
        if (err) {
            console.error("Insert Error:", err);
            return res.status(500).json({ error: err.message, full: err });
        }

        res.json({
            success: true,
            rowsAffected: result.affectedRows
        });
    });
});

/* =========================
   DELETE
========================= */
app.delete('/api/:table', (req, res) => {
    const table = req.params.table.toUpperCase();

    if (!ALLOWED_TABLES.includes(table)) {
        return res.status(400).json({ error: 'Invalid table' });
    }

    const keys = req.body;

    if (!keys || Object.keys(keys).length === 0) {
        return res.status(400).json({ error: 'No keys provided' });
    }

    const conditions = [];
    const values = [];

    for (const [col, val] of Object.entries(keys)) {
        conditions.push(`${col} = ?`);
        values.push(val);
    }

    const query = `DELETE FROM \`${table}\` WHERE ${conditions.join(' AND ')}`;

    db.query(query, values, (err, result) => {
        if (err) {
            console.error("Delete Error:", err);
            return res.status(500).json({ error: err.message, full: err });
        }

        res.json({
            success: true,
            rowsAffected: result.affectedRows
        });
    });
});

/* =========================
   START SERVER
========================= */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});