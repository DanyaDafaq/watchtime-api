const tmi = require('tmi.js');
const express = require('express');

const CHANNEL_NAME = 'Noeliv_';

const app = express();

// 💾 память (временное хранение)
const store = {};
const activeUsers = new Set();

// ===== Twitch bot =====
const client = new tmi.Client({
    channels: [CHANNEL_NAME]
});

client.connect();

client.on('message', (channel, tags, message, self) => {
    if (self) return;
    if (!tags || !tags.username) return;

    activeUsers.add(tags.username.toLowerCase());
});

// ===== начисление watchtime =====
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
app.get('/', (req, res) => {
    res.send('Watchtime API is running');
});

app.get('/watchtime/:user', (req, res) => {
    const user = req.params.user.toLowerCase();

    const minutes = store[user] || 0;

    const text = '${user} был на стриме ${formatTime(minutes)} в этом месяце';

    res.setHeader('Content-Type', 'text/plain');
    res.send(text);
});

// ===== PORT (обязательно для Render) =====
const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
    console.log('API running on port', PORT);
});