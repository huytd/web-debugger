const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const fs = require('fs');
const path = require('path');
const Dbg = require('chrome-remote-interface');
const Docker = require('dockerode');
const exec = require('child_process').exec;

const rmDir = (dir) => {
  exec(`rm -rf ${dir}`);
};

const wait = (ms) => new Promise((resolve, _) => setTimeout(resolve, ms));

const randomRange = (min, max) => {
  return Math.floor(Math.random() * (max - min) ) + min;
};

const docker = new Docker({
  socketPath: '/var/run/docker.sock'
});

io.on('connection', async (socket) => {
  socket.on('beginDebug', async msg => {
    console.log('Debug session started');
    const { code } = JSON.parse(msg);

    console.log('Write code');
    const session = `playground/${Date.now().toPrecision(21)}`;
    if (!fs.existsSync(`./${session}`)) {
      fs.mkdirSync(`./${session}`);
    }

    const localPort = randomRange(1000, 9999);
    fs.writeFileSync(path.join(__dirname + '/' + session + '/code.js'), code);

    let container;
    try {
      const cmd = "node --inspect-brk=0.0.0.0 code.js"
      container = await docker.createContainer({
        'Image': 'node',
        'Cmd': ["/bin/bash", "-c", cmd],
        'ExposedPorts': {
          '9229/tcp': {}
        },
        'HostConfig': {
          'Binds': [`${path.join(__dirname + "/" + session)}:/usr/app/src`],
          'PortBindings': {
            '9229/tcp': [
              {
                'HostIp': '0.0.0.0',
                'HostPort': `${localPort}`
              }
            ]
          }
        },
        'WorkingDir': '/usr/app/src'
      });
    } catch (err) {
      console.error(err);
    }

    console.log('Starting debugger');
    container.start();
    console.log("Debugger started");

    await wait(500);

    Dbg({
      host: '0.0.0.0',
      port: localPort
    }, async (client) => {
      console.log('Debugger connected');

      const { Debugger, Runtime } = client;

      Runtime.consoleAPICalled(({type, args}) => {
        console.log("CONSOLE CALL", type, args);
        const msg = args.map(o => o.value || o.description).join(' ');
        socket.emit('Debugger.console', JSON.stringify({ type, msg }));
      });

      socket.on('stepIn', () => {
        try {
          Debugger.stepInto();
        } catch {
          socket.emit('Debugger.stop');
        }
      });

      socket.on('stepOut', () => {
        Debugger.stepOut();
      });

      socket.on('stepOver', () => {
        Debugger.stepOver();
      });

      socket.on('eval', async (msg) => {
        const { callFrameId, expressions } = JSON.parse(msg);
        console.log("LOOKING FOR", expressions);
        const result = await Promise.all(expressions.map(async e => {
          const ret = await Debugger.evaluateOnCallFrame({
            callFrameId,
            expression: `${e}`,
            silent: true,
            returnByValue: true
          });
          return {
            name: e,
            result: ret.result
          };
        }));
        socket.emit('Debugger.evalResult', JSON.stringify({ result }));
      });

      Debugger.paused(async ({ callFrames }) => {
        const frame = callFrames[0];
        const callFrameId = frame.callFrameId;
        const url = frame.url;
        if (url.match(/file:\/\/\//)) {
          const location = frame.location;
          const scope = frame.scopeChain[0];
          socket.emit('Debugger.paused', JSON.stringify({ callFrameId, location, scope }));
        } else {
          await Debugger.stepOver();
        }
      });

      await Runtime.enable();
      await Runtime.runIfWaitingForDebugger();
      await Debugger.enable();
    }).on('error', err => {
      console.error(err);
    });

    const stop = async () => {
      console.log('user disconnected');
      await container.stop();
      await container.remove();
      rmDir(`./${session}`);
    };

    socket.on('stopDebug', () => {
      stop();
    });

    socket.on('disconnect', () => {
      stop();
    });
  });
});

app.use('/', express.static('./'));

http.listen(process.env.PORT || 3000, () => {
  console.log('listening...');
});
