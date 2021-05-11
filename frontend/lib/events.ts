export type UIEventHandlerFn = (event: Event) => void;
export type UIEventHandler = {
  name: string,
  action: UIEventHandlerFn
};

export class UIEventSystem {
  target: EventTarget;

  constructor() {
    this.target = new EventTarget();
  }

  emit(name: string, data?: any) {
    const e = new CustomEvent(name, {
      detail: data,
      cancelable: true
    });
    return this.target.dispatchEvent(e);
  }

  on(name: string, fn: UIEventHandlerFn) {
    return this.target.addEventListener(name, fn, false);
  }

  ons(handlers: UIEventHandler[]) {
    handlers.forEach(({ name, action }) => {
      this.on(name, action);
    });
  }

  once(name: string, fn: UIEventHandlerFn) {
    return this.target.addEventListener(name, fn, { once: true });
  }

  off(name: string, fn: UIEventHandlerFn) {
    return this.target.removeEventListener(name, fn, false);
  }
};

