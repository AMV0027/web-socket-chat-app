const WebSocket = require('ws');
const express = require('express');
const http = require('http');

const app = express();

// Create an HTTP server from Express app
const server = http.createServer(app);

// Initialize WebSocket server to use the HTTP server
const wss = new WebSocket.Server({ server });

let users = {};
let rooms = {};

// WebSocket connection handling
wss.on('connection', (ws) => {
    ws.on('message', (message) => {
        const data = JSON.parse(message);

        // Handle different message types
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

                // Create the room if it doesn't exist
                if (!rooms[room]) {
                    rooms[room] = [];
                }
                rooms[room].push(ws);
                users[ws.username] = room;

                broadcastRoomUsers(room);
                break;

            case 'message':
                // Broadcast message to users in room
                broadcastMessage(ws.room, {
                    type: 'message',
                    username: ws.username,
                    message: data.message,
                    messageType: data.messageType, // 'text', 'image', 'gif'
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

// Helper function to broadcast message to everyone in the room
const broadcastMessage = (room, message) => {
    if (rooms[room]) {
        rooms[room].forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(message));
            }
        });
    }
};

// Helper function to broadcast list of users in the room
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

// Use the dynamic port Render assigns via the `PORT` environment variable
const PORT = 443;
server.listen(PORT, () => {
    console.log(`WebSocket Server running on port ${PORT}`);
});
