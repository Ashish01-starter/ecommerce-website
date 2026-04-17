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
   PRIMARY KEY MAP (FOR UPDATE)
========================= */
const PRIMARY_KEYS = {
    BUYER: ['BuyerID'],
    EMPLOYEE: ['EmpID'],
    PRODUCT: ['ProductID'],
    SELLER: ['SellerID'],
    TRANSACTIONS: ['TxnID'],
    PURCHASES: ['BuyerID', 'ProductID'],
    MANAGES: ['SellerID', 'EmpID']
};

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
            return res.status(500).json({ error: err.message });
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

    db.query(`SELECT * FROM \`${table}\``, (err, result) => {
        if (err) {
            console.error("Fetch Error:", err);
            return res.status(500).json({ error: err.message });
        }
        res.json(result);
    });
});

/* =========================
   LOOKUP (FOREIGN KEYS)
========================= */
app.get('/api/lookup/:table', (req, res) => {
    const table = req.params.table.toUpperCase();

    if (!PRIMARY_KEYS[table]) {
        return res.status(400).json({ error: 'Invalid table' });
    }

    const pk = PRIMARY_KEYS[table][0];

    db.query(`SELECT ${pk} AS ID FROM \`${table}\``, (err, result) => {
        if (err) {
            console.error("Lookup Error:", err);
            return res.status(500).json({ error: err.message });
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
            return res.status(500).json({ error: err.message });
        }

        res.json({
            success: true,
            rowsAffected: result.affectedRows
        });
    });
});

/* =========================
   UPDATE (FIXED PROPERLY)
========================= */
app.put('/api/:table', (req, res) => {
    const table = req.params.table.toUpperCase();

    if (!ALLOWED_TABLES.includes(table)) {
        return res.status(400).json({ error: 'Invalid table' });
    }

    const data = req.body;
    const pkCols = PRIMARY_KEYS[table];

    if (!pkCols) {
        return res.status(400).json({ error: 'No primary key defined' });
    }

    // Split PK and non-PK fields
    const updateCols = Object.keys(data).filter(col => !pkCols.includes(col));
    const updateValues = updateCols.map(col => data[col]);

    const whereClause = pkCols.map(col => `${col} = ?`).join(' AND ');
    const whereValues = pkCols.map(col => data[col]);

    const query = `
        UPDATE \`${table}\`
        SET ${updateCols.map(col => `${col} = ?`).join(', ')}
        WHERE ${whereClause}
    `;

    db.query(query, [...updateValues, ...whereValues], (err, result) => {
        if (err) {
            console.error("Update Error:", err);
            return res.status(500).json({ error: err.message });
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

    const data = req.body;
    const pkCols = PRIMARY_KEYS[table];

    if (!pkCols) {
        return res.status(400).json({ error: 'No primary key defined' });
    }

    const whereClause = pkCols.map(col => `${col} = ?`).join(' AND ');
    const values = pkCols.map(col => data[col]);

    const query = `DELETE FROM \`${table}\` WHERE ${whereClause}`;

    db.query(query, values, (err, result) => {
        if (err) {
            console.error("Delete Error:", err);
            return res.status(500).json({ error: err.message });
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