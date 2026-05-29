const tmi = require('tmi.js');
const express = require('express');
const Database = require('better-sqlite3');

const CHANNEL_NAME = 'Noeliv_';

const app = express();

// ✅ правильное создание базы (better-sqlite3)
const db = new Database('./watchtime.db');

// таблица
db.exec(`
CREATE TABLE IF NOT EXISTS watchtime (
    user TEXT,
    month TEXT,
    minutes INTEGER DEFAULT 0,
    PRIMARY KEY(user, month)
)
`);

function getCurrentMonth() {
    const now = new Date();
    return now.getFullYear() + '-' +
        String(now.getMonth() + 1).padStart(2, '0');
}

function formatTime(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours + 'ч ' + mins + 'м';
}

const activeUsers = new Set();

const client = new tmi.Client({
    channels: [CHANNEL_NAME]
});

client.connect();

client.on('message', (channel, tags, message, self) => {
    if (self) return;
    activeUsers.add(tags.username.toLowerCase());
});

setInterval(() => {
    const month = getCurrentMonth();

    const stmt = db.prepare(`
        INSERT INTO watchtime(user, month, minutes)
        VALUES (?, ?, 1)
        ON CONFLICT(user, month)
        DO UPDATE SET minutes = minutes + 1
    `);

    activeUsers.forEach(user => {
        stmt.run(user, month);
    });

    activeUsers.clear();

}, 60000);

app.get('/watchtime/:user', (req, res) => {
    const user = req.params.user.toLowerCase();
    const month = getCurrentMonth();

    const row = db.prepare(`
        SELECT minutes
        FROM watchtime
        WHERE user = ? AND month = ?
    `).get(user, month);

    const minutes = row ? row.minutes : 0;

    res.send(`${user} был на стриме ${formatTime(minutes)} в этом месяце`);
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log('Watchtime API started');
});