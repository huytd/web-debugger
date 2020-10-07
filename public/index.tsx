import './styles/main.scss';
import './styles/shadowfox.css';
import * as React from 'react';
import { render } from 'react-dom';

import CodeMirror from 'codemirror';
import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/material-palenight.css';
import 'codemirror/theme/solarized.css';
import 'codemirror/mode/javascript/javascript.js';
import 'codemirror/keymap/vim.js';
import io from 'socket.io-client';

// Config Vim key binding
CodeMirror.Vim.map("jk", "<Esc>", "insert");

let editor;
const socket = io();

const gutterMarker = () => {
  var marker = document.createElement("div");
  marker.style.color = "#00ff00";
  marker.innerHTML = "►";
  return marker;
};

const TEMPLATE_CODE = window.localStorage.getItem('kodes-code') || `const n = 10;
let fib = Array(n).fill(0);

for (let i = 0; i < n; i++) {
  if (i <= 1) {
    fib[i] = 1;
  }
  else {
    fib[i] = fib[i - 1] + fib[i - 2];
    console.log(fib[i], '=', fib[i - 1], '+', fib[i - 2]);
  }
}`;

const SVG = {
  play: (
    <svg x="0px" y="0px" viewBox="0 0 20 20" enableBackground="new 0 0 20 20">
      <path fill="currentColor" d="M15,10.001c0,0.299-0.305,0.514-0.305,0.514l-8.561,5.303C5.51,16.227,5,15.924,5,15.149V4.852
      c0-0.777,0.51-1.078,1.135-0.67l8.561,5.305C14.695,9.487,15,9.702,15,10.001z"/>
    </svg>
  ),
  debug: (
    <svg x="0px" y="0px" viewBox="0 0 20 20" enableBackground="new 0 0 20 20">
      <path fill="currentColor" d="M10,1C7.7907715,1,6,2.7908325,6,5h8C14,2.7908325,12.2092285,1,10,1z M19,10h-3V7.5031738
      c0-0.02771-0.0065918-0.0535278-0.0080566-0.0808716l2.2150879-2.21521c0.390625-0.3905029,0.390625-1.0236816,0-1.4141846
      c-0.3903809-0.390564-1.0236816-0.390564-1.4140625,0l-2.215332,2.21521C14.550293,6.0066528,14.5246582,6,14.4970703,6H5.5029297
      C5.4753418,6,5.449707,6.0066528,5.4223633,6.0081177l-2.215332-2.21521c-0.3903809-0.390564-1.0236816-0.390564-1.4140625,0
      c-0.390625,0.3905029-0.390625,1.0236816,0,1.4141846l2.2150879,2.21521C4.0065918,7.449646,4,7.4754639,4,7.5031738V10H1
      c-0.5522461,0-1,0.4476929-1,1c0,0.5522461,0.4477539,1,1,1h3c0,0.7799683,0.15625,1.520813,0.4272461,2.2037354
      c-0.0441895,0.0316162-0.0947266,0.0494995-0.1342773,0.0891724l-2.8286133,2.8283691
      c-0.3903809,0.390564-0.3903809,1.0237427,0,1.4142456c0.390625,0.3905029,1.0239258,0.3905029,1.4143066,0L5.4802246,15.93396
      C6.3725586,16.9555054,7.6027832,17.6751099,9,17.9100342V8h2v9.9100342
      c1.3972168-0.2349243,2.6274414-0.9545288,3.5197754-1.9760132l2.6015625,2.6015015
      c0.3903809,0.3905029,1.0236816,0.3905029,1.4143066,0c0.3903809-0.3905029,0.3903809-1.0236816,0-1.4142456l-2.8286133-2.8283691
      c-0.0395508-0.0396729-0.0900879-0.0575562-0.1342773-0.0891724C15.84375,13.520813,16,12.7799683,16,12h3
      c0.5522461,0,1-0.4477539,1-1C20,10.4476929,19.5522461,10,19,10z"/>
    </svg>
  ),
  stop: (
    <svg x="0px" y="0px" viewBox="0 0 20 20" enableBackground="new 0 0 20 20">
      <path fill="currentColor" d="M15,3h-2c-0.553,0-1,0.048-1,0.6v12.8c0,0.552,0.447,0.6,1,0.6h2c0.553,0,1-0.048,1-0.6V3.6
      C16,3.048,15.553,3,15,3z M7,3H5C4.447,3,4,3.048,4,3.6v12.8C4,16.952,4.447,17,5,17h2c0.553,0,1-0.048,1-0.6V3.6
      C8,3.048,7.553,3,7,3z"/>
    </svg>
  ),
  stepIn: (
    <svg x="0px" y="0px" viewBox="0 0 20 20" enableBackground="new 0 0 20 20">
      <path fill="currentColor" d="M12.244,9.52L5.041,4.571C4.469,4.188,4,4.469,4,5.196v9.609c0,0.725,0.469,1.006,1.041,0.625l7.203-4.951
      c0,0,0.279-0.199,0.279-0.478C12.523,9.721,12.244,9.52,12.244,9.52z M14,4h1c0.553,0,1,0.048,1,0.6v10.8c0,0.552-0.447,0.6-1,0.6
      h-1c-0.553,0-1-0.048-1-0.6V4.6C13,4.048,13.447,4,14,4z"/>
    </svg>
  ),
  watch: (
    <svg x="0px" y="0px" viewBox="0 0 20 20" enableBackground="new 0 0 20 20">
      <path fill="currentColor" d="M19.4,9H16V5.6C16,5,15.6,5,15,5s-1,0-1,0.6V9h-3.4C10,9,10,9.4,10,10s0,1,0.6,1H14v3.4c0,0.6,0.4,0.6,1,0.6
      s1,0,1-0.6V11h3.4c0.6,0,0.6-0.4,0.6-1S20,9,19.4,9z M7.4,9H0.6C0,9,0,9.4,0,10s0,1,0.6,1h6.8C8,11,8,10.6,8,10S8,9,7.4,9z M7.4,14
      H0.6C0,14,0,14.4,0,15s0,1,0.6,1h6.8C8,16,8,15.6,8,15S8,14,7.4,14z M7.4,4H0.6C0,4,0,4.4,0,5s0,1,0.6,1h6.8C8,6,8,5.6,8,5
      S8,4,7.4,4z"/>
    </svg>
  )
};

const App = () => {
  const editorRef = React.useRef();

  let editorState = {
    lastScope: null,
    lastPos: null
  };

  const [ watchList, setWatchList ] = React.useState([ "n", "fib", "i", "fib[i]" ]);
  const [ watchResult, setWatchResult ] = React.useState(watchList.map(w => ({ name: w, value: 'undefined' })));
  const [ buttonStates, setButtonStates ] = React.useState(0b11001);

  const [ consoleResult, consoleDispatch ] = React.useReducer(
    (state, action) => {
      switch (action.type) {
        case 'ADD_LOG':
          return state.concat(action.value)
        case 'CLEAR_LOG':
          return [];
        default:
          throw new Error();
      }
    }, []
  );

  let isPlaying = false;

  const changeWatchList = () => {
    let list = window.prompt(
      "Enter the list of expressions to watch (comma separated):",
      watchList.join(", ")
    );
    setWatchList(list.split(',').map(w => w.trim()));
  };

  React.useEffect(() => {
    setWatchResult(watchList.map(w => ({ name: w, value: 'undefined' })));
  }, [watchList]);

  React.useEffect(() => {
    if (editorRef.current) {
      editor = CodeMirror.fromTextArea(editorRef.current, {
        lineNumbers: true,
        lineWrapping: true,
        showCursorWhenSelecting: true,
        styleSelectedText: true,
        // theme: 'solarized light',
        theme: 'material-palenight',
        mode: 'javascript',
        keyMap: 'vim',
        gutters: ["CodeMirror-linenumbers", "breakpoints"]
      });
    }
  }, []);

  const cleanUp = (keepConsole = false) => {
    if (editorState.lastScope) editorState.lastScope.clear();
    if (editorState.lastPos) editorState.lastPos.clear();
    if (editor) editor.clearGutter('breakpoints');
    if (!keepConsole) {
      consoleDispatch({ type: 'CLEAR_LOG' });
    }
  }

  const disableEditing = () => {
    editor.setOption('readOnly', true);
  };

  const enableEditing = () => {
    editor.setOption('readOnly', false);
  };

  const [ playDebug, setPlayDebug ] = React.useState(() => () => {});
  const [ startDebug, setStartDebug ] = React.useState(() => () => {});
  const [ stopDebug, setStopDebug ] = React.useState(() => () => {});
  const [ nextStepDebug, setNextStepDebug] = React.useState(() => () => {});

  React.useEffect(() => {
    socket.off('Debugger.paused').on('Debugger.paused', msg => {
      const { callFrameId, location, scope } = JSON.parse(msg);

      const scopefrom = { line: scope.startLocation.lineNumber, ch: 0 };
      const scopeto = { line: scope.endLocation.lineNumber, ch: scope.endLocation.columnNumber };
      if (editorState.lastScope) editorState.lastScope.clear();
      editorState.lastScope = editor.markText(scopefrom, scopeto, { className: "styled-scope-background" });

      const from = { line: location.lineNumber, ch: location.columnNumber };
      const to = { line: location.lineNumber, ch: location.columnNumber + 1 };
      if (editorState.lastPos) editorState.lastPos.clear();
      editorState.lastPos = editor.markText(from, to, { className: "styled-background" });
      editor.clearGutter("breakpoints");
      editor.setGutterMarker(from.line, "breakpoints", gutterMarker());

      editor.scrollIntoView(from, 20);

      socket.emit('eval', JSON.stringify({
        callFrameId,
        expressions: watchList
      }));

      if (isPlaying) {
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
      consoleDispatch({ type: 'ADD_LOG', value: { type, msg } });
    });

    socket.off('Debugger.stop').on('Debugger.stop', () => {
      console.log("Debugger auto stop");
      isPlaying = false;
      setButtonStates(0b11001);
      enableEditing();
    });

    const startDebug = () => {
      cleanUp();
      disableEditing();
      const code = editor.getValue();
      socket.emit('beginDebug', JSON.stringify({
        code: code
      }));
      window.localStorage.setItem('kodes-code', code);
    };

    setPlayDebug(() => () => {
      isPlaying = true;
      setButtonStates(0b00100);
      startDebug();
    });

    setStartDebug(() => () => {
      isPlaying = false;
      setButtonStates(0b00110);
      startDebug();
    });

    setStopDebug(() => () => {
      isPlaying = false;
      socket.emit('stopDebug');
      cleanUp(true);
      setButtonStates(0b11001);
      enableEditing();
    });

    setNextStepDebug(() => () => {
      socket.emit('stepIn');
    });
  }, [watchList]);

  const consoleRef = React.useRef();
  React.useEffect(() => {
    if (consoleRef.current) {
      consoleRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [consoleResult]);

  return (
    <div className="container dark">
      <div className="panel editor">
        <textarea id="code-editor" ref={editorRef} defaultValue={TEMPLATE_CODE}></textarea>
      </div>
      <div className="panel console">
        <div className="title">console</div>
        <div id="console">
        {consoleResult.map(c => (
          <div className={["log", c.type].join(" ")}>{c.msg}</div>
        ))}
        <div ref={consoleRef}/>
        </div>
      </div>
      <div className="panel debugger-controller">
        <button id="btn-play" disabled={!(1 & (buttonStates >> 4))} onClick={playDebug}>{SVG.play}</button>
        <button id="btn-debug" disabled={!(1 & (buttonStates >> 3))} onClick={startDebug}>{SVG.debug}</button>
        <button id="btn-stop" disabled={!(1 & (buttonStates >> 2))} onClick={stopDebug}>{SVG.stop}</button>
        <button id="btn-stepin" disabled={!(1 & (buttonStates >> 1))} onClick={nextStepDebug}>{SVG.stepIn}</button>
        <button id="btn-watch" disabled={!(1 & (buttonStates >> 0))} onClick={changeWatchList}>{SVG.watch}</button>
      </div>
      <div className="panel debugger-watcher">
        <div className="title">watch expressions</div>
        <div id="watcher">
        {watchResult.map(r => (
          <div style={{}}>
            {r.name} = {JSON.stringify(r.value)}
          </div>
        ))}
        </div>
      </div>
    </div>
  );
};

render(<App/>, document.getElementById("root"));
