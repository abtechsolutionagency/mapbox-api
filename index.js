const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors')
const app = express();
const port = 3001;

app.use(cors())

// Connect to the SQLite database
const db = new sqlite3.Database('./water_data.db');

// Define an API endpoint to get data from the database

function categorizeByTimestamp(data) {
    return data.reduce((acc, item) => {
        const { timestamp } = item;
        if (!acc[timestamp]) {
            acc[timestamp] = [];
        }
        acc[timestamp].push(item);
        return acc;
    }, {});
}


function getFirstDateData(categorizedData) {
    const timestamps = Object.keys(categorizedData);
    if (timestamps.length === 0) {
        return null; // No data available
    }

    // Sort timestamps to get the earliest one
    timestamps.sort((a, b) => new Date(a) - new Date(b));

    const firstTimestamp = timestamps[0];
    return categorizedData[firstTimestamp];
}

app.get('/api/data', (req, res) => {
    db.all('SELECT * FROM water_data', [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }

        res.json({ data: rows });
    });
});

app.get('/api/timestamp', (req, res) => {
    const { date } = req.query;

    if (!date) {
        res.status(400).json({ error: 'Date query parameter is required' });
        return;
    }

    const query = 'SELECT * FROM water_data WHERE DATE(timestamp) = ?';
    db.all(query, [date], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }

        res.json({ data: rows });
    });
});


app.get('/api/day', (req, res) => {
    db.all('SELECT * FROM water_data', [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        const data = categorizeByTimestamp(rows)
        const result = getFirstDateData(data)

        res.json({ data: result });
    });
});

app.get('/api/unique-locations', (req, res) => {
    db.all('SELECT COUNT(DISTINCT location) as uniqueCount FROM water_data', [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ uniqueCount: rows[0].uniqueCount });
    });
});

app.get('/api/water-levels', (req, res) => {
    db.get('SELECT MIN(water_level) as minWaterLevel, MAX(water_level) as maxWaterLevel FROM water_data', [], (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ minWaterLevel: row.minWaterLevel, maxWaterLevel: row.maxWaterLevel });
    });
});


// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
