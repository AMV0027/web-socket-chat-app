const WebSocket = require('ws');
let rooms = {};
let users = {};

module.exports = (req, res) => {
  // Create an HTTP server for WebSocket
  const server = new WebSocket.Server({ noServer: true });

  // WebSocket connection setup
  server.on('connection', (ws) => {
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
          broadcastMessage(ws.room, {
            type: 'message',
            username: ws.username,
            message: data.message,
            messageType: data.messageType, // 'text', 'image', or 'gif'
            timestamp: new Date().toISOString(),
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

  // Handle the server upgrade for WebSocket
  if (req.headers.upgrade !== 'websocket') {
    res.status(400).send('Invalid request');
    return;
  }

  server.handleUpgrade(req, req.socket, Buffer.alloc(0), (client) => {
    server.emit('connection', client, req);
  });
};
