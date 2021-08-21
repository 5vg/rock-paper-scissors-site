/*jshint esversion: 6 */

const express = require('express');
const http = require('http');

const app = express();
const server = http.createServer(app);
const io = require('socket.io')(server);

const gameMap = new Map();

let waiting = null;
let roomId = 1;

io.on('connection', (sock) => {
  sock.emit('msg', 'connected');
  sock.on('msg', (msg) => io.emit('msg', msg));

  sock.once('disconnect', () => {
    for (const [key, value] of gameMap) {
      if (value[0] === sock) {
        gameMap.delete(key);
        value[1].emit('msg', 'p1 has disconnected');
        addToQueue(value[1]);
      } else if (value[1] === sock) {
        gameMap.delete(key);
        value[0].emit('msg', 'p2 has disconnected');
        addToQueue(value[0]);
      }
    }
  });

  addToQueue(sock);
});

function addToQueue(player) {
  if (waiting === null) {
    player.emit('msg', 'waiting');
    waiting = player;
  } else {
    startGame(waiting, player);
    waiting = null;
  }
}

function startGame(p1, p2) {
  const roomName = 'RPS' + roomId++;
  gameMap.set(1, [p1, p2]);

  let p1Turn = null;
  let p2Turn = null;

  [p1, p2].forEach((p) => p.join(roomName));
  io.to(roomName).emit('msg', 'game started');
  p1.emit('msg', 'you are p1');
  p2.emit('msg', 'you are p2');

  p1.on('turn', (e) => {
    p1Turn = e;
    checkRoundEnd();
  });

  p2.on('turn', (e) => {
    p2Turn = e;
    checkRoundEnd();
  });

  function checkRoundEnd() {
    if (p1Turn !== null && p2Turn !== null) {
      io.to(roomName).emit('msg', 'round ended p1 - ' + p1Turn +
      ' p2 - ' + p2Turn);
      notifyWinner();

      io.to(roomName).emit('msg', 'next round');

      p1Turn = p2Turn = null;
    }
  }

  function notifyWinner() {
    if ((p1Turn === 'rock' && p2Turn === 'scissors') ||
    (p1Turn === 'paper' && p2Turn === 'rock') ||
    (p1Turn === 'scissors' && p2Turn === 'paper')) {
      p1.emit('msg', 'you win');
      p2.emit('msg', 'you lose');
    } else if ((p1Turn === 'rock' && p2Turn === 'paper') ||
    (p1Turn === 'paper' && p2Turn === 'scissors') ||
    (p1Turn === 'scissors' && p2Turn === 'rock')) {
      p2.emit('msg', 'you win');
      p1.emit('msg', 'you lose');
    } else if ((p1Turn === 'rock' && p2Turn === 'rock') ||
    (p1Turn === 'paper' && p2Turn === 'paper') ||
    (p1Turn === 'scissors' && p2Turn === 'scissors')) {
      io.to(roomName).emit('msg', 'draw');
    }
  }
}

app.use(express.static(__dirname + '/public'));

server.listen(3000, () => console.log('open on port 3000'));
