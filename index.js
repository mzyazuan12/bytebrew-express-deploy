const express = require('express');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();

const pool = new Pool({
    host: process.env.PSQL_HOST,
    user: process.env.PSQL_USER,
    database: process.env.PSQL_DATABASE,
    password: process.env.PSQL_PASSWORD,
    port: Number(process.env.PSQL_PORT),
    ssl: { rejectUnauthorized: false }
});

app.get('/', (req, res) => {
    res.send('ByteBrew Express Server');
});

app.get('/items', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT itemid, name, cost FROM items LIMIT 10'
        );
        res.json(result.rows);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Database connection failed');
    }
});

const port = process.env.PORT || 3000;

app.listen(port, '0.0.0.0', () => {
    console.log(`Server running on port ${port}`);
});

process.on('SIGINT', async () => {
    await pool.end();
    process.exit(0);
});
