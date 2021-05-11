import * as React from 'react';
import { SVG } from '~/constants';
import './styles.scss';

export const Controller = ({ eventSystem }) => {
  const events = eventSystem;
  const [ buttonStates, setButtonStates ] = React.useState(0b111001);

  const cleanUp = (keepConsole = false) => {
    events.emit("EDITOR_CLEANUP");
    if (!keepConsole) {
      events.emit("CONSOLE_CLEAR");
    }
  };

  events.ons([
    {
      name: 'CONTROLLER_CLEANUP',
      action: ({ detail: { keepConsole }}) => {
        cleanUp(keepConsole);
      }
    },
    {
      name: 'CONTROLLER_BUTTON_STATE',
      action: ({ detail: { state }}) => {
        // TODO: Move the logic to control button state into this component
        // do not expose it to outer place.
        setButtonStates(state);
      }
    }
  ]);

  const executeCode = () => {
    events.emit("DEBUGGER_EXECUTE");
  };

  const startDebug = () => {
    events.emit('DEBUGGER_START', { play: false });
  };

  const playDebug = () => {
    events.emit('DEBUGGER_START', { play: true });
  };

  const nextStep = () => {
    events.emit('DEBUGGER_NEXT_STEP');
  };

  const stopDebug = () => {
    events.emit('DEBUGGER_STOP', { doNotCleanup: false });
  };

  const changeWatchList = () => {
    // TODO: Implemenet change watch list feature
  };

  return (
    <React.Fragment>
      <button
        id="btn-run"
        disabled={!(1 & (buttonStates >> 5))}
        onClick={executeCode}
        title="Execute Code"
      >
        {SVG.run}
      </button>
      <button
        id="btn-play"
        disabled={!(1 & (buttonStates >> 4))}
        onClick={playDebug}
        title="Autoplay Debug"
      >
        {SVG.play}
      </button>
      <button
        id="btn-debug"
        disabled={!(1 & (buttonStates >> 3))}
        onClick={startDebug}
        title="Debug"
      >
        {SVG.debug}
      </button>
      <button
        id="btn-stop"
        disabled={!(1 & (buttonStates >> 2))}
        onClick={stopDebug}
        title="Stop Debug"
      >
        {SVG.stop}
      </button>
      <button
        id="btn-stepin"
        disabled={!(1 & (buttonStates >> 1))}
        onClick={nextStep}
        title="Next Step"
      >
        {SVG.stepIn}
      </button>
      <button
        id="btn-watch"
        disabled={!(1 & (buttonStates >> 0))}
        onClick={changeWatchList}
        title="Change Watch List"
      >
        {SVG.watch}
      </button>
    </React.Fragment>
  )
};