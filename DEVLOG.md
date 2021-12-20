![](https://raw.githubusercontent.com/huytd/web-debugger/master/metadata/screenshot.png)

# Where it begins

Was building a JS playground to help visualize how variables change during execution. It requires user to manually write log using `debug()` method.

Would be great if the app can automatically detect changes or print out everything needed to see at each step, just like a debugger.

To achieve this, I need to write a debugger that run inside the browser. This is doable but the amount of works is just absurb. It include a complete rewrite (or reinvent) of a JavaScript engine, which doesn't seems so productive at all. I need to find another approach to do it.

Then I discovered the Chrome Debugging Protocol, which is exactly what I needed. It's the communication protocol to let you communicate with a running Node.JS Debugger or Chrome Debugger process, control the debug flow such as step in, step out, execute code on the current call frame,...

# The PoC

I quickly came up with a small PoC that run inside a terminal, the way it work is: Take a code snippet, write it to a temporary folder, spawn a new `node` process with `--inspect-brk` parameter to put it in debugging mode, then connect to it via a library called `chrome-remote-interface`, it can do some debugging command like step in, step out,...

This PoC helped me understand the protocol better and able to figure out what I could build from it.

At the very beginning, I had to deal with a poorly documented protocol with lots of hidden behavior, takes a lot of time to figure out what's going on and how to get over them.

For example, calling `Debugger.pause` doesn't immediatelly pause the debugger, but the method has a callback so it seems confusing, I thought we can handle the pause event in that callback. Turned out, we need to handle `Debugger.paused` event in order to do so.

Stuff like `Debugger.stepIn` also need to be executed when the debugger is paused.

So I scoped out what's the next version look like:

- A small debugger that can execute any code snipped input from the user
- The call stack is limited to the scope of current code, that mean, all call frames that belongs to Node.js internal will be step over.
- There will be a watch list where you can see the values on current call frame.

# The Prototype

The next piece of road block I need to solve is to containerize the debugging process, so every debug session will be isolated from each other. Some may argue that containerize may not be the best security model for executing arbitrary code, but weak is better than nothing.

I probably don't have too much interesting things to share here, the main idea of this method is:

- Allocate a random port on the server. This port will be used as a bridge to connect the Node debugger process and the Web UI.
- Create a container with the input code from the user.
- Start the Node debug process, running on the allocated port above.
- From the Web UI, connect to the containerized Node Debugger through WebSocket to start debugging.
- When the debug process is done, signal the server so it can stop and delete that container.

With the backend ready, I quickly came up with a Web UI prototype using React and Hooks.

Writing UI using Function Component and Hooks allows you to quickly build up something that you can actually touch and run, for the only reason: Less code to write.

When it come to a more complex UI things, like handling the communication across components, continuously manipulate the state, or messing with some external changing variables such as CodeMirror editor instance or WebSocket connection, the code messing up quickly with full of hacks and workarounds.

The main reason is because the closure nature of Hooks, variables tends to keep its original values at the time the hook being created, for example, in a `useEffect`, and a dependency array is something you'd be looking to. This is, however, still tricky enough, for example, there are things that I want my `useEffect` block being depends on but in different count of times.

```
useEffect(() => {
   ...
}, [ socket, consoleMessages ]);
```

In this example, the `useEffect` depends on `socket` and `consoleMessages`, but I only want it to to be updated on `socket` only once, and updated on `consoleMessages` changes all the time.

Eventually, I ended up with a Single Source File application -- literally everything inside an `index.tsx`. And the development process starts to slow down, mostly because the spagetti code  that coupling everywhere, time to navigate the code starts to increase as well. So I decided that it's time for a rewrite with a better architecture.

# Re-architecture

The idea is, spliting the UI into many different parts, and everything are connected together via an event system, components communicate by passing around messages. By doing this, I can add or remove any component at anytime without breaking the whole thing.

![](https://i.imgur.com/jkOUxws.png)

In order to do so, I need an Event System, it's fun (and trivial) to build one from scratch.

When I finished the Event System, the first thing I tried to consolidate is the Editor. Simply because this is the most critical part in the debugger, as it has the direct connection with the Debugging process (feed the code to the debugger, reflects on the state change of the debugger,...).

Thing goes pretty well and the whole refactoring process is not as complex as I initial thought. In fact, the use of Event System make it very easy to consolidate things in the initial prototype into smaller components.

The following diagram show the communication flow between each components using the Event System:

![](https://i.imgur.com/lLuW1gj.png)

# Research
## Debugger Backend
- **In-Browser Debugging**
  - This is an implementation of James Long based on **Exceptional Continuations in JavaScript** paper. It's an approach to build an in-browser debugger, kind of.
  - The idea behind this is, transform the input script into a **state-machine** where each execution scope is a state, stepping thru the code mean switching between states.
  - The approach seems like there's an absurb amount of work, but it's still interesting.
  - **References:**
    - http://www.schemeworkshop.org/2007/procPaper4.pdf
    - https://jlongster.com/Whats-in-a-Continuation
    - https://github.com/jlongster/unwinder/blob/master/lib/visit.js
    - https://github.com/jlongster/unwinder/blob/master/runtime/vm.js
- **Time Travel Debugging**
  - **References:**
    - http://www.earlbarr.com/publications/ttdebugging.pdf
- **Other:**
  - **References:**
    - https://hal.inria.fr/hal-01745792/document
    - https://digitalcommons.calpoly.edu/cgi/viewcontent.cgi?referer=https://scholar.google.com/&httpsredir=1&article=1046&context=csse_fac
    - https://www.worldscientific.com/doi/abs/10.1142/9789814612883_0015
    - https://arxiv.org/pdf/1802.02974.pdf
