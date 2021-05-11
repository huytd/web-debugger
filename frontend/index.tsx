import '~/styles/layout.scss';

import * as React from 'react';
import { render } from 'react-dom';
import io from 'socket.io-client';

import { TEMPLATE_WATCH, SVG } from '~/constants';
import { UIEventSystem } from '~/lib/events';

import { Editor } from '~/components/Editor';
import { Console } from '~/components/Console';
import { Controller } from '~/components/Controller';

const socket = io();

const App = () => {
  const events = new UIEventSystem();

  const editorRef = React.useRef(null)

  // TODO: Implement WatchList component
  const [ watchList, setWatchList ] = React.useState(TEMPLATE_WATCH);
  const [ watchResult, setWatchResult ] = React.useState(watchList.map(w => ({ name: w, value: 'undefined' })));
  const [ localVariablesResult, setLocalVariablesResult ] = React.useState([]);

  const isPlaying = React.useRef(false);

  events.ons([
    {
      name: 'DEBUGGER_EXECUTE',
      action: () => {
        if (socket) {
          const code = editorRef.current.getValue();
          socket.emit('zap', JSON.stringify({ code }));
        }
      }
    },
    {
      name: 'DEBUGGER_START',
      action: (e) => {
        const { detail: { play = false }} = e;
        isPlaying.current = play;
        if (isPlaying.current) {
          events.emit('CONTROLLER_BUTTON_STATE', { state: 0b000100 });
        } else {
          events.emit('CONTROLLER_BUTTON_STATE', { state: 0b000110 });
        }
        events.emit('CONTROLLER_CLEANUP', { keepConsole: false });
        events.emit('EDITOR_DISABLE');
        const code = editorRef.current.getValue();
        socket.emit('beginDebug', JSON.stringify({
          code: code
        }));
        window.localStorage.setItem('kodes-code', code);
      }
    },
    {
      name: 'DEBUGGER_STOP',
      action: ({ detail: { doNotCleanup = false }}) => {
        isPlaying.current = false;
        socket.emit('stopDebug');
        if (!doNotCleanup) {
          events.emit('CONTROLLER_CLEANUP', { keepConsole: false });
        }
        events.emit('CONTROLLER_BUTTON_STATE', { state: 0b111001 });
        events.emit('EDITOR_ENABLE');
      }
    },
    {
      name: 'DEBUGGER_NEXT_STEP',
      action: () => {
        socket.emit('stepIn');
      }
    }
  ]);

  // TODO: Move this change watchlist logic somewhere
  const changeWatchList = () => {
    let list = window.prompt(
      "Enter the list of expressions to watch (comma separated):",
      watchList.join(", ")
    );
    window.localStorage.setItem("kodes-watch", list);
    setWatchList(list.split(',').map(w => w.trim()));
  };

  React.useEffect(() => {
    setWatchResult(watchList.map(w => ({ name: w, value: 'undefined' })));
  }, [watchList]);

  React.useEffect(() => {
    socket.off('zapResult').on('zapResult', msg => {
      const { stderr, stdout } = JSON.parse(msg);
      if (stderr) {
        events.emit('CONSOLE_WRITE', {
          type: 'error',
          msg: stderr
        });
      }
      if (stdout) {
        stdout.split("\n").forEach(line => {
          events.emit('CONSOLE_WRITE', {
            type: 'log',
            msg: line
          });
        });
      }
    });

    socket.off('Debugger.paused').on('Debugger.paused', msg => {
      const { callFrameId, location, scope, variables } = JSON.parse(msg);

      const scopefrom = { line: scope.startLocation.lineNumber, ch: 0 };
      const scopeto = { line: scope.endLocation.lineNumber, ch: scope.endLocation.columnNumber };
      events.emit('EDITOR_MARK_SCOPE', {
        from: scopefrom,
        to: scopeto,
        className: "styled-scope-background"
      });

      const from = { line: location.lineNumber, ch: location.columnNumber };
      const to = { line: location.lineNumber, ch: location.columnNumber + 1 };
      events.emit('EDITOR_MARK_POSITION', {
        from,
        to,
        className: "styled-background"
      });

      events.emit('EDITOR_MARK_GUTTER', {
        line: from.line
      });

      events.emit('EDITOR_SCROLL_TO_VIEW', { from });

      socket.emit('eval', JSON.stringify({
        callFrameId,
        expressions: watchList
      }));

      const localVars = variables.result || [];
      setLocalVariablesResult(localVars.map(v => {
        return {
          name: v.name,
          value: v.value?.value || v.value?.description || "undefined"
        }
      }).filter(v => {
        return v.name.match(/exports|require|module|__filename|__dirname/) === null;
      }));

      if (isPlaying.current) {
        setTimeout(() => {
          socket.emit('stepIn');
        }, 500);
      }
    });

    const popuplateResult = (data) => {
      const results = JSON.parse(data).result;
      let output = results.map(e => {
        return {
          name: e.name,
          value: e.result.value || "undefined"
        }
      });
      setWatchResult(output);
    };

    socket.off('Debugger.evalResult').on('Debugger.evalResult', data => {
      popuplateResult(data);
    });

    socket.off('Debugger.console').on('Debugger.console', (data) => {
      const { type, msg } = JSON.parse(data);
      events.emit('CONSOLE_WRITE', { type, msg });
    });

    socket.off('Debugger.errorThrown').on('Debugger.errorThrown', (data) => {
      const { description } = JSON.parse(data);
      const lineMatch = description.match(/code\.js\:(\d+)/) || [];
      if (lineMatch.length) {
        const line = (parseInt(lineMatch[1]) || 1) - 1;
        const lineLength = editorRef.current.getLine(line).length;
        const from = { line: line, ch: 0 };
        const to = { line: line, ch: lineLength };
        events.emit('EDITOR_MARK_LINE', {
          from,
          to,
          className: "styled-error"
        });
      }
      events.emit('CONSOLE_WRITE', {
        type: 'error',
        msg: description
      });
      events.emit('DEBUGGER_STOP', {
        doNotCleanup: true
      });
    });

    socket.off('Debugger.stop').on('Debugger.stop', () => {
      console.log("Debugger auto stop");
      isPlaying.current = false;
      events.emit('CONTROLLER_BUTTON_STATE', { state: 0b111001 });
      events.emit('EDITOR_ENABLE');
    });
  }, [watchList]);

  return (
    <div className="container light">
      <div className="panel editor">
        <Editor eventSystem={events} ref={editorRef} />
      </div>
      <div className="panel console">
        <Console eventSystem={events}/>
      </div>
      <div className="panel debugger-controller">
        <Controller eventSystem={events}/>
      </div>
      <div className="panel debugger-watcher">
        <div className="sub-panel watchList">
          <div className="title">watch expressions</div>
          <div id="watcher">
            {watchResult.map(r => (
              <div className="watch-item">
                {r.name} = {JSON.stringify(r.value)}
              </div>
            ))}
          </div>
        </div>
        <div className="sub-panel localVariables">
          <div className="title">local variables</div>
          <div id="variables">
            {localVariablesResult.map(r => (
              <div className="watch-item">
                {r.name} = {JSON.stringify(r.value)}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

render(<App/>, document.getElementById("root"));
