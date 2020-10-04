const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const fs = require('fs');
const exec = require('child_process').exec;
const Dbg = require('chrome-remote-interface');


const wait = (ms) => new Promise((resolve, _) => setTimeout(resolve, ms));

io.on('connection', async (socket) => {
  socket.on('beginDebug', async msg => {
    console.log('Debug session started');
    const { code } = JSON.parse(msg);
    console.log('Write code');
    fs.writeFileSync('./code.js', code);
    console.log('Starting debugger');
    let process = exec('node --inspect-brk code.js');
    console.log("Debugger started");

    await wait(500);

    Dbg({
      host: 'localhost',
      port: 9229
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

    const stop = () => {
      console.log('user disconnected');
      process.kill('SIGHUP');
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
