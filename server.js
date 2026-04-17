const express = require('express');
const cors = require('cors');
const db = require('./db');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

/* =========================
   TABLE MAP (🔥 FIX)
========================= */
const TABLE_MAP = {
    TRANSACTION: 'TRANSACTIONS'
};

function getRealTable(table) {
    return TABLE_MAP[table] || table;
}

/* =========================
   ALLOWED TABLES
========================= */
const ALLOWED_TABLES = [
    'BUYER', 'EMPLOYEE', 'MANAGES',
    'PRODUCT', 'PURCHASES', 'SELLER',
    'TRANSACTION', 'TRANSACTIONS' // allow both
];

/* =========================
   PRIMARY KEYS
========================= */
const PRIMARY_KEYS = {
    BUYER: ['BuyerID'],
    EMPLOYEE: ['EmpID'],
    PRODUCT: ['ProductID'],
    SELLER: ['SellerID'],
    TRANSACTION: ['TxnID'],
    TRANSACTIONS: ['TxnID'],
    PURCHASES: ['BuyerID', 'ProductID'],
    MANAGES: ['SellerID', 'EmpID']
};

/* =========================
   SCHEMA
========================= */
app.get('/api/schema/:table', (req, res) => {
    let table = req.params.table.toUpperCase();

    if (!ALLOWED_TABLES.includes(table)) {
        return res.status(400).json({ error: 'Invalid table' });
    }

    const realTable = getRealTable(table);

    const query = `
        SELECT COLUMN_NAME, DATA_TYPE
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = ?
    `;

    db.query(query, [realTable], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(result);
    });
});

/* =========================
   GET DATA
========================= */
app.get('/api/:table', (req, res) => {
    let table = req.params.table.toUpperCase();

    if (!ALLOWED_TABLES.includes(table)) {
        return res.status(400).json({ error: 'Invalid table' });
    }

    const realTable = getRealTable(table);

    db.query(`SELECT * FROM \`${realTable}\``, (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(result);
    });
});

/* =========================
   INSERT
========================= */
app.post('/api/:table', (req, res) => {
    let table = req.params.table.toUpperCase();

    if (!ALLOWED_TABLES.includes(table)) {
        return res.status(400).json({ error: 'Invalid table' });
    }

    const realTable = getRealTable(table);

    const data = req.body;
    const cols = Object.keys(data);
    const values = Object.values(data);

    const query = `INSERT INTO \`${realTable}\` (${cols.join(', ')}) VALUES (${cols.map(()=>'?').join(', ')})`;

    db.query(query, values, (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

/* =========================
   DELETE
========================= */
app.delete('/api/:table', (req, res) => {
    let table = req.params.table.toUpperCase();

    if (!ALLOWED_TABLES.includes(table)) {
        return res.status(400).json({ error: 'Invalid table' });
    }

    const realTable = getRealTable(table);

    const pkCols = PRIMARY_KEYS[table];
    const values = pkCols.map(col => req.body[col]);

    const query = `DELETE FROM \`${realTable}\` WHERE ${pkCols.map(c => `${c}=?`).join(' AND ')}`;

    db.query(query, values, (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

/* =========================
   START
========================= */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});