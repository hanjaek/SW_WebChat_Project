const express = require('express');
const app = express();
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

const port = 3000;
const wsPort = 8080;

app.use(express.static(path.join(__dirname, 'public')));

const server = http.createServer(app);
server.listen(port, () => {
  console.log(`HTTP server is running on http://localhost:${port}`);
});

const wss = new WebSocket.Server({ port: wsPort });

const users = new Map(); // 사용자 저장을 위한 Map

wss.on('connection', function(ws) {
  let nickname = "익명";

  ws.on('message', function(message) {
    const data = JSON.parse(message);
    switch (data.type) {
      case 'nickname':
        nickname = data.nickname;
        users.set(ws, nickname);
        broadcastUsersList();
        break;
      case 'message':
        broadcastMessage(`${nickname}: ${data.message}`);
        break;
    }
  });

  ws.on('close', function() {
    users.delete(ws);
    broadcastUsersList();
  });

  ws.send(JSON.stringify({ type: 'welcome', message: 'Welcome to the chat server!' }));
  broadcastUsersList();
});

function broadcastMessage(message) {
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ type: 'message', message }));
    }
  });
}

function broadcastUsersList() {
  const nicknames = Array.from(users.values());
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ type: 'usersList', users: nicknames }));
    }
  });
}

console.log(`WebSocket server is running on ws://localhost:${wsPort}`);
