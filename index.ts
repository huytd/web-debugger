const express = require('express');
const app = express();
const http = require('http').createServer(app);
const ws = require('socket.io')(http);
const Docker = require('dockerode');
const Bundler = require('parcel-bundler');
const {handleSocketSession} = require('./backend/debugger');

const docker = new Docker({
  socketPath: '/var/run/docker.sock'
});

ws.on('connection', async (socket) => {
  handleSocketSession(socket, docker);
});

const entryFile = './frontend/index.html';
const options = {};
const bundler = new Bundler(entryFile, options);
app.use(bundler.middleware());

http.listen(process.env.PORT || 3000, () => {
  console.log('listening...');
});
