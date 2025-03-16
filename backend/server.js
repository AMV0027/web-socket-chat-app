const WebSocket = require("ws");
const express = require("express");
const http = require("http");
const { v4: uuidv4 } = require("uuid");
const path = require("path");

// Create Express app
const app = express();
app.use(express.static(path.join(__dirname, "public")));

// Setup HTTP server
const server = http.createServer(app);

// Create WebSocket server
const wss = new WebSocket.Server({ server });

// Data stores
const users = {}; // username -> user info
const rooms = {}; // roomName -> array of connected clients
const roomHistory = {}; // roomName -> array of messages (limited history)
const MAX_HISTORY = 50; // Maximum messages to keep in history per room

// Ping/pong to detect dead connections
function heartbeat() {
  this.isAlive = true;
}

// Check connection status periodically
const interval = setInterval(() => {
  wss.clients.forEach((ws) => {
    if (ws.isAlive === false) {
      console.log(
        `Client ${
          ws.username || "unknown"
        } connection terminated (unresponsive)`
      );
      return ws.terminate();
    }
    ws.isAlive = false;
    ws.ping();
  });
}, 30000);

wss.on("close", () => {
  clearInterval(interval);
});

// Helper function to generate message id
function generateMessageId() {
  return uuidv4();
}

// Handle incoming connections
wss.on("connection", (ws) => {
  ws.isAlive = true;
  ws.on("pong", heartbeat);

  console.log("New client connected");

  ws.on("message", (message) => {
    let data;
    try {
      data = JSON.parse(message);
    } catch (err) {
      console.error("Invalid message format", err);
      return;
    }

    switch (data.type) {
      case "setUsername":
        handleSetUsername(ws, data);
        break;
      case "joinRoom":
        handleJoinRoom(ws, data);
        break;
      case "message":
        handleMessage(ws, data);
        break;
      case "typing":
        handleTyping(ws, data);
        break;
      case "getRoomHistory":
        handleGetRoomHistory(ws, data);
        break;
      default:
        console.log(`Unknown message type: ${data.type}`);
        break;
    }
  });

  ws.on("close", () => {
    handleClientDisconnect(ws);
  });

  ws.on("error", (error) => {
    console.error(`WebSocket error: ${error.message}`);
  });
});

// Handle username setting
function handleSetUsername(ws, data) {
  const username = data.username?.trim();
  if (!username) {
    sendError(ws, "Username cannot be empty");
    return;
  }

  // Check if username already in use by an ACTIVE connection
  let usernameInUse = false;
  wss.clients.forEach((client) => {
    if (
      client !== ws &&
      client.username === username &&
      client.readyState === WebSocket.OPEN
    ) {
      usernameInUse = true;
    }
  });

  if (usernameInUse) {
    sendError(ws, "Username already taken");
  } else {
    ws.username = username;
    users[username] = { active: true };
    console.log(`User set username: ${username}`);
  }
}

// Handle room joining
function handleJoinRoom(ws, data) {
  if (!ws.username) {
    sendError(ws, "Please set a username first");
    return;
  }

  const roomName = data.room?.trim();
  if (!roomName) {
    sendError(ws, "Room name cannot be empty");
    return;
  }

  // Leave previous room if any
  if (ws.room && rooms[ws.room]) {
    removeFromRoom(ws);
  }

  // Join new room
  ws.room = roomName;
  if (!rooms[roomName]) {
    rooms[roomName] = [];
    roomHistory[roomName] = [];
    console.log(`Created new room: ${roomName}`);
  }

  rooms[roomName].push(ws);
  users[ws.username].room = roomName;

  // Notify client of successful join
  ws.send(
    JSON.stringify({
      type: "joinResponse",
      success: true,
      room: roomName,
    })
  );

  console.log(`User ${ws.username} joined room: ${roomName}`);

  // Broadcast updated user list
  broadcastRoomUsers(roomName);
}

// Handle message sending
function handleMessage(ws, data) {
  if (!ws.username) {
    sendError(ws, "Please set a username first");
    return;
  }

  if (!ws.room) {
    sendError(ws, "Please join a room first");
    return;
  }

  // Validate message
  if (
    !data.message ||
    (typeof data.message !== "string" && !data.message.startsWith("data:"))
  ) {
    sendError(ws, "Invalid message format");
    return;
  }

  // Create message object
  const messageObj = {
    type: "message",
    id: generateMessageId(),
    username: ws.username,
    message: data.message,
    messageType: data.messageType || "text",
    timestamp: new Date().toISOString(),
  };

  // Add to room history
  if (roomHistory[ws.room]) {
    roomHistory[ws.room].push(messageObj);

    // Limit history size
    if (roomHistory[ws.room].length > MAX_HISTORY) {
      roomHistory[ws.room] = roomHistory[ws.room].slice(-MAX_HISTORY);
    }
  }

  // Broadcast message to all users in the room
  broadcastMessage(ws.room, messageObj);
}

// Handle typing indicator
function handleTyping(ws, data) {
  if (!ws.username || !ws.room) {
    return;
  }

  // Throttle typing broadcasts (don't spam)
  const now = Date.now();
  if (ws.lastTypingTime && now - ws.lastTypingTime < 1000) {
    return;
  }

  ws.lastTypingTime = now;

  broadcastMessage(ws.room, {
    type: "typing",
    username: ws.username,
    timestamp: new Date().toISOString(),
  });
}

// Handle room history request
function handleGetRoomHistory(ws, data) {
  if (!ws.username) {
    sendError(ws, "Please set a username first");
    return;
  }

  const roomName = data.room || ws.room;
  if (!roomName || !roomHistory[roomName]) {
    sendError(ws, "Room not found");
    return;
  }

  ws.send(
    JSON.stringify({
      type: "roomHistory",
      messages: roomHistory[roomName],
    })
  );
}

// Handle client disconnect
function handleClientDisconnect(ws) {
  console.log(`Client disconnected: ${ws.username || "unknown"}`);

  if (ws.username) {
    delete users[ws.username];
  }

  if (ws.room) {
    removeFromRoom(ws);
  }
}

// Helper function to remove client from room
function removeFromRoom(ws) {
  const roomName = ws.room;

  if (rooms[roomName]) {
    rooms[roomName] = rooms[roomName].filter((client) => client !== ws);

    if (rooms[roomName].length === 0) {
      console.log(
        `Room ${roomName} is empty, preserving history for reconnects`
      );
      // Optional: delete empty room after timeout
      setTimeout(() => {
        if (rooms[roomName] && rooms[roomName].length === 0) {
          console.log(`Deleting empty room: ${roomName}`);
          delete rooms[roomName];
          delete roomHistory[roomName];
        }
      }, 10 * 60 * 1000); // 10 minutes
    } else {
      broadcastRoomUsers(roomName);
    }
  }
}

// Send error message to client
function sendError(ws, message) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(
      JSON.stringify({
        type: "error",
        message: message,
      })
    );
  }
}

// Broadcast message to all clients in a room
function broadcastMessage(roomName, message) {
  if (!rooms[roomName]) return;

  const messageStr = JSON.stringify(message);

  rooms[roomName].forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(messageStr);
    }
  });
}

// Broadcast room users list
function broadcastRoomUsers(roomName) {
  if (!rooms[roomName]) return;

  const usersList = rooms[roomName]
    .filter((client) => client.username)
    .map((client) => client.username);

  const message = JSON.stringify({
    type: "roomUsers",
    users: usersList,
    userCount: usersList.length,
    room: roomName,
  });

  rooms[roomName].forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

// Start the server
const PORT = process.env.PORT || 443;
server.listen(PORT, () => {
  console.log(`WebSocket Server running on port ${PORT}`);
});
