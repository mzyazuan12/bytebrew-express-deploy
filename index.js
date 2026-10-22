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

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function renderPage(body) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>ByteBrew</title>
    <style>
        body {
            margin: 0;
            font-family: Georgia, "Times New Roman", serif;
            background: #f6f1e8;
            color: #2b2118;
        }
        main {
            max-width: 640px;
            margin: 0 auto;
            padding: 48px 20px 64px;
        }
        h1 {
            margin: 0 0 8px;
            font-size: 2.4rem;
        }
        p {
            margin: 0 0 28px;
            color: #5c4d40;
        }
        ul {
            list-style: none;
            margin: 0;
            padding: 0;
        }
        li {
            display: flex;
            justify-content: space-between;
            gap: 16px;
            padding: 14px 0;
            border-bottom: 1px solid #e2d6c6;
        }
        .price {
            font-variant-numeric: tabular-nums;
            white-space: nowrap;
        }
    </style>
</head>
<body>
    <main>
        ${body}
    </main>
</body>
</html>`;
}

async function sendMenu(res) {
    try {
        const result = await pool.query(
            'SELECT itemid, name, cost FROM items ORDER BY itemid LIMIT 10'
        );
        const drinks = result.rows.map((item) => {
            const price = Number(item.cost).toFixed(2);
            return `<li><span>${escapeHtml(item.name)}</span><span class="price">$${escapeHtml(price)}</span></li>`;
        }).join('');

        res.type('html').send(renderPage(`
            <h1>ByteBrew</h1>
            <p>Drinks</p>
            <ul>${drinks}</ul>
        `));
    } catch (error) {
        console.error(error.message);
        res.status(500).type('html').send(renderPage(`
            <h1>ByteBrew</h1>
            <p>Database connection failed.</p>
        `));
    }
}

app.get('/', (req, res) => sendMenu(res));
app.get('/items', (req, res) => sendMenu(res));

const port = process.env.PORT || 3000;

app.listen(port, '0.0.0.0', () => {
    console.log(`Server running on port ${port}`);
});

process.on('SIGINT', async () => {
    await pool.end();
    process.exit(0);
});
