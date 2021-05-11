import * as React from 'react';

import './styles.scss';

export const Console = ({ eventSystem }) => {
  const [ state, dispatch ] = React.useReducer(
    (state, action) => {
      switch (action.type) {
        case 'WRITE':
          return state.concat(action.value);
        case 'CLEAR':
          return [];
        default:
          throw new Error("Wrong action dispatched");
      }
    },
    []
  );
  const bottomRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [state]);

  eventSystem.ons([
    {
      name: 'CONSOLE_WRITE',
      action: ({ detail: { type, msg }}) => {
        dispatch({
          type: 'WRITE',
          value: { type, msg }
        });
      }
    },
    {
      name: 'CONSOLE_CLEAR',
      action: () => {
        dispatch({
          type: 'CLEAR'
        });
      }
    }
  ]);

  return (
    <>
      <div className="title">console</div>
      <div id="console">
        {state.map(c => (
          <pre className={["log", c.type].join(" ")}>{c.msg}</pre>
        ))}
        <div ref={bottomRef} />
      </div>
    </>
  )
};