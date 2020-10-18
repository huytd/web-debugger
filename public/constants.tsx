import * as React from 'react';

export const TEMPLATE_CODE = window.localStorage.getItem('kodes-code') || `const n = 10;
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
export const TEMPLATE_WATCH = (window.localStorage.getItem("kodes-watch") || "n, fib, i, fib[i]").split(",").map(w => w.trim());

export const SVG = {
  run: (
    <svg viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
    </svg>
  ),
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