const tmi = require('tmi.js');
const express = require('express');

const CHANNEL_NAME = 'Noeliv_';

const app = express();

// 💾 простое хранилище (в RAM)
const store = {};
const activeUsers = new Set();

// ===== Twitch bot =====
const client = new tmi.Client({
    channels: [CHANNEL_NAME]
});

client.connect();

client.on('message', (channel, tags, message, self) => {
    if (self) return;

    activeUsers.add(tags.username.toLowerCase());
});

// ===== начисление времени =====
setInterval(() => {
    activeUsers.forEach(user => {
        if (!store[user]) {
            store[user] = 0;
        }

        store[user] += 1; // 1 минута
    });

    activeUsers.clear();
}, 60000);

// ===== формат времени =====
function formatTime(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return '${hours}ч ${mins}м';
}

// ===== API =====
app.get('/watchtime/:user', (req, res) => {
    const user = req.params.user.toLowerCase();

    const minutes = store[user] || 0;

    res.send(`${user} был на стриме ${formatTime(minutes)} в этом месяце`);
});

// ===== health check =====
app.get('/', (req, res) => {
    res.send('Watchtime API is running');
});

// ===== render port =====
const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
    console.log('API running on port', PORT);
});