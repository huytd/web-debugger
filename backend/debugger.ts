const {randomRange, rmDir, runInDocker, wait} = require('./utils');

const path = require('path');
const fs = require('fs');
const Dbg = require('chrome-remote-interface');

const HOST_IP = '0.0.0.0';
const PLAYGROUND_PATH = '../playground';

export const runDebugSession = (localPort, socket, container, sessionPath) => {
  return new Promise(async (resolve) => {
    try {
      const client = await Dbg({
        host: HOST_IP,
        port: localPort
      });

      console.log('Debugger connected');

      const { Debugger, Runtime } = client;

      Runtime.consoleAPICalled(({ type, args }) => {
        const msg = args.map(o => o.value || o.description).join(' ');
        socket.emit('Debugger.console', JSON.stringify({ type, msg }));
      });

      Runtime.exceptionThrown(({ exceptionDetails }) => {
        const { exception: { className, description } } = exceptionDetails;
        socket.emit('Debugger.errorThrown', JSON.stringify({
          type: className,
          description: description
        }));
      });

      socket.on('stepIn', () => {
        Debugger.stepInto();
      });

      socket.on('stepOut', () => {
        Debugger.stepOut();
      });

      socket.on('stepOver', () => {
        Debugger.stepOver();
      });

      socket.on('eval', async (msg) => {
        const { callFrameId, expressions } = JSON.parse(msg);
        const result = await Promise.all(expressions.map(async (e) => {
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
        if (callFrames.length <= 1) {
          stop();
        } else {
          const frame = callFrames[0];
          const callFrameId = frame.callFrameId;
          const url = frame.url;
          if (url.match(/file:\/\/\//)) {
            const location = frame.location;
            // const scope = frame.scopeChain[0];
            const scope = frame.scopeChain.find(scope => scope.type === 'local');
            console.log("SCOPE", scope, scope.object.objectId);
            const variables = await Runtime.getProperties({ objectId: scope.object.objectId });
            socket.emit('Debugger.paused', JSON.stringify({ callFrameId, location, scope, variables }));
          } else {
            await Debugger.stepOver();
          }
        }
      });

      const stop = async () => {
        console.log('Debugger disconnected');
        if (socket) {
          socket.emit('Debugger.stop');
          const events = socket.eventNames();
          events.forEach(event => {
            if (event !== 'beginDebug') {
              const fns = socket.listeners(event);
              fns.forEach(fn => {
                socket.removeListener(event, fn);
              });
            }
          });
        }
        if (client) {
          await client.close();
        }
        if (container) {
          await container.stop();
          await container.remove();
        }
        rmDir(sessionPath);
        resolve();
      };

      socket.on('stopDebug', async () => {
        await stop();
      });

      socket.on('disconnect', async () => {
        await stop();
      });

      console.log("Start up the debgugging process");
      await Runtime.enable();
      await Runtime.runIfWaitingForDebugger();
      await Debugger.enable();
    } catch(err) {
      await container.stop();
      await container.remove();
      throw new Error(err);
    }
  });
}

export const handleSocketSession = (socket, docker) => {
  const writeCode = (src) => {
    const session = path.join(__dirname, `${PLAYGROUND_PATH}/${Date.now().toPrecision(21)}`);
    if (!fs.existsSync(session)) {
      fs.mkdirSync(session);
    }
    fs.writeFileSync(path.join(session, 'code.js'), src);
    return session;
  };

  socket.on('zap', async msg => {
    const { code } = JSON.parse(msg);
    const debugPath = writeCode(code);
    const cmd = "node code.js"
    const result = await runInDocker(docker, 'node', cmd, {
      'HostConfig': {
        'Binds': [`${debugPath}:/usr/app/src`],
      },
      'WorkingDir': '/usr/app/src'
    });

    socket.emit('zapResult', JSON.stringify(result));
  });

  socket.on('beginDebug', async msg => {
    console.log('Debug session started');
    const { code } = JSON.parse(msg);

    console.log('Write code');
    const debugPath = writeCode(code);

    const localPort = randomRange(1000, 9999);
    let container;
    try {
      const cmd = "node --inspect-brk=" + HOST_IP + " code.js"
      container = await docker.createContainer({
        'Image': 'node',
        'Cmd': ["/bin/bash", "-c", cmd],
        'ExposedPorts': {
          '9229/tcp': {}
        },
        'HostConfig': {
          'Binds': [`${debugPath}:/usr/app/src`],
          'PortBindings': {
            '9229/tcp': [
              {
                'HostIp': HOST_IP,
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

    try {
      await runDebugSession(localPort, socket, container, debugPath);
    } catch (err) {
      console.log("ApplicationError:")
      console.error(err);
    }
  });
}
