import * as React from 'react';

import CodeMirror from 'codemirror';
import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/material-palenight.css';
import 'codemirror/theme/solarized.css';
import 'codemirror/mode/javascript/javascript.js';
import 'codemirror/keymap/vim.js';
import { TEMPLATE_CODE } from '~/constants';
import { gutterMarker } from '~/lib/utils';

import './styles.scss';

// Config Vim key binding
// @ts-ignore
CodeMirror.Vim.map("jk", "<Esc>", "insert");

export const EditorComponent = ({ eventSystem }, ref) => {

  const editorElRef = React.useRef();

  let editorState = {
    lastScope: null,
    lastPos: null,
    lastLine: null
  };

  const cleanUp = () => {
    if (editorState.lastScope) editorState.lastScope.clear();
    if (editorState.lastPos) editorState.lastPos.clear();
    if (editorState.lastLine) editorState.lastLine.clear();
    if (ref.current) ref.current.clearGutter('breakpoints');
  };

  const disableEditing = () => {
    ref.current.setOption('readOnly', true);
  };

  const enableEditing = () => {
    ref.current.setOption('readOnly', false);
  };

  React.useEffect(() => {
    if (editorElRef.current) {
      ref.current = CodeMirror.fromTextArea(editorElRef.current, {
        lineNumbers: true,
        lineWrapping: true,
        showCursorWhenSelecting: true,
        // @ts-ignore
        styleSelectedText: true,
        theme: 'solarized light',
        // theme: 'material-palenight',
        mode: 'javascript',
        keyMap: 'vim',
        gutters: ["CodeMirror-linenumbers", "breakpoints"]
      });

      eventSystem.ons([
        {
          name: 'EDITOR_CLEANUP',
          action: () => {
            cleanUp();
          }
        },
        {
          name: 'EDITOR_DISABLE',
          action: () => {
            disableEditing();
          }
        },
        {
          name: 'EDITOR_ENABLE',
          action: () => {
            enableEditing();
          }
        },
        {
          name: 'EDITOR_MARK_SCOPE',
          action: ({ detail: { from, to, className } }) => {
            if (editorState.lastScope) editorState.lastScope.clear();
            editorState.lastScope = ref.current.markText(from, to, { className });
          }
        },
        {
          name: 'EDITOR_MARK_POSITION',
          action: ({ detail: { from, to, className } }) => {
            if (editorState.lastPos) editorState.lastPos.clear();
            editorState.lastPos = ref.current.markText(from, to, { className });
          }
        },
        {
          name: 'EDITOR_MARK_LINE',
          action: ({ detail: { from, to, className } }) => {
            if (editorState.lastLine) editorState.lastLine.clear();
            editorState.lastLine = ref.current.markText(from, to, { className });
          }
        },
        {
          name: 'EDITOR_MARK_GUTTER',
          action: ({ detail: { line } }) => {
            ref.current.clearGutter("breakpoints");
            ref.current.setGutterMarker(line, "breakpoints", gutterMarker());
          }
        },
        {
          name: 'SCROLL_TO_VIEW',
          action: ({ detail: { from } }) => {
            ref.current.scrollIntoView(from, 20);
          }
        }
      ]);
    }
  }, []);

  return (
    <textarea id="code-editor" ref={editorElRef} defaultValue={TEMPLATE_CODE}></textarea>
  );
};

export const Editor = React.forwardRef(EditorComponent);