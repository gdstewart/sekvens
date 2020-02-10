import React from "react";
import logo from "./logo.svg";
import "./App.css";
import { createSecureContext } from "tls";
import { create } from "domain";

const sweepLength = 1;

const createOscillator = (
  context: AudioContext,
  freq: number
): [OscillatorNode, GainNode] => {
  const oscillator = context.createOscillator();
  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(freq, context.currentTime);

  let sweepEnv = context.createGain();
  oscillator.connect(sweepEnv);
  sweepEnv.connect(context.destination);
  oscillator.start();

  return [oscillator, sweepEnv];
};

const noteToFreq = {
  a: 440,
  s: 493.88,
  d: 523.25,
  f: 587.33,
  g: 659.25,
  h: 698.46
};

let oscillators: { [key: string]: Array<[OscillatorNode, GainNode]> } = {};
const isKey = (key: string): key is keyof typeof noteToFreq =>
  key in noteToFreq;

const audio = () => {
  const context = new AudioContext();
  document.addEventListener("keydown", e => {
    const key = e.key;
    if (!isKey(key)) {
      return;
    }
    if (!oscillators[key]) {
      oscillators[key] = [];
    }
    if (oscillators[key].length) {
      return;
    }
    const [oscillator, sweepEnv] = createOscillator(context, noteToFreq[key]);

    sweepEnv.gain.cancelScheduledValues(context.currentTime);
    sweepEnv.gain.setValueAtTime(sweepEnv.gain.value, context.currentTime);
    sweepEnv.gain.exponentialRampToValueAtTime(1, context.currentTime + 0.1);

    oscillators[key].unshift([oscillator, sweepEnv]);
  });

  const clearKey = (key: string) => {
    if (isKey(key)) {
      const pair = oscillators[key].pop();
      if (!pair) {
        return;
      }
      const [_, sweepEnv] = pair;
      sweepEnv.gain.cancelScheduledValues(context.currentTime);
      sweepEnv.gain.setValueAtTime(sweepEnv.gain.value, context.currentTime);
      sweepEnv.gain.exponentialRampToValueAtTime(
        0.0001,
        context.currentTime + 1
      );
    }
  };

  document.addEventListener("keyup", e => {
    clearKey(e.key);
  });
};

audio();

const App = () => {
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.tsx</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  );
};

export default App;
