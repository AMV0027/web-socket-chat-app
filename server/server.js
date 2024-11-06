const WebSocket = require('ws');
const express = require('express');
const http = require('http');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let users = {};
let rooms = {};

wss.on('connection', (ws) => {
    ws.on('message', (message) => {
        const data = JSON.parse(message);

        switch (data.type) {
            case 'setUsername':
                if (users[data.username]) {
                    ws.send(JSON.stringify({ type: 'error', message: 'Username already taken.' }));
                } else {
                    ws.username = data.username;
                    users[ws.username] = ws.room;
                }
                break;

            case 'joinRoom':
                const room = data.room;
                ws.room = room;

                if (!rooms[room]) {
                    rooms[room] = [];
                }
                rooms[room].push(ws);
                users[ws.username] = room;

                broadcastRoomUsers(room);
                break;

            case 'message':
                // Handle all message types (text, image, gif) with proper messageType
                broadcastMessage(ws.room, {
                    type: 'message',
                    username: ws.username,
                    message: data.message,
                    messageType: data.messageType, // 'text', 'image', or 'gif'
                    timestamp: new Date().toISOString()
                });
                break;

            case 'typing':
                broadcastMessage(ws.room, {
                    type: 'typing',
                    username: ws.username,
                });
                break;
        }
    });

    ws.on('close', () => {
        const room = ws.room;
        if (room && rooms[room]) {
            rooms[room] = rooms[room].filter((client) => client !== ws);
            if (rooms[room].length === 0) {
                delete rooms[room];
            } else {
                broadcastRoomUsers(room);
            }
        }
        delete users[ws.username];
    });
});

const broadcastMessage = (room, message) => {
    if (rooms[room]) {
        rooms[room].forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(message));
            }
        });
    }
};

const broadcastRoomUsers = (room) => {
    if (rooms[room]) {
        const userCount = rooms[room].length;
        const usersList = rooms[room].map(client => client.username);
        const usersMsg = JSON.stringify({ type: 'roomUsers', users: usersList, userCount });

        rooms[room].forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(usersMsg);
            }
        });
    }
};

const PORT = 4000;
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});