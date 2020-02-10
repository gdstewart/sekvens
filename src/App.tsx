import React from "react";
import logo from "./logo.svg";
import "./App.css";
import { createSecureContext } from "tls";
import { create } from "domain";

const sweepLength = 1;

const createFlute = (context: AudioContext, freq: number): (() => void) => {
  const oscillator = context.createOscillator();
  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(freq, context.currentTime);

  let sweepEnv = context.createGain();
  oscillator.connect(sweepEnv);
  sweepEnv.connect(context.destination);
  sweepEnv.gain.setValueAtTime(0.0000001, context.currentTime);
  const startCompletionTime = context.currentTime + 0.1;
  sweepEnv.gain.exponentialRampToValueAtTime(1, startCompletionTime);
  oscillator.start();

  return () => {
    sweepEnv.gain.cancelScheduledValues(context.currentTime);
    sweepEnv.gain.setValueAtTime(sweepEnv.gain.value, context.currentTime);
    sweepEnv.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 1);
  };
};

const createWhiteNoise = (context: AudioContext) => {
  const bufferSize = 4 * context.sampleRate;
  const noiseBuffer = context.createBuffer(1, bufferSize, context.sampleRate);
  const output = noiseBuffer.getChannelData(0);
  for (var i = 0; i < bufferSize; i++) {
    output[i] = Math.random() * 2 - 1;
  }

  var whiteNoise = context.createBufferSource();
  whiteNoise.buffer = noiseBuffer;
  whiteNoise.loop = true;
  return whiteNoise;
};

const createPad = (context: AudioContext, freq: number): (() => void) => {
  const squareOscillator = context.createOscillator();
  squareOscillator.frequency.value = freq;
  squareOscillator.type = "sawtooth";

  const triangleOscillator = context.createOscillator();
  triangleOscillator.frequency.value = freq - freq / 700;
  triangleOscillator.type = "triangle";

  const filter = context.createBiquadFilter();
  filter.type = "lowshelf";
  filter.frequency.value = freq * 1.5;

  const whiteNoise = createWhiteNoise(context);

  const whiteNoiseGain = context.createGain();
  whiteNoiseGain.gain.value = 0.1;
  whiteNoise.connect(whiteNoiseGain);

  [squareOscillator, triangleOscillator, whiteNoiseGain].forEach(o =>
    o.connect(filter)
  );

  const gain = context.createGain();

  filter.connect(gain);

  gain.connect(context.destination);

  const startCompletionTime = context.currentTime + 0.1;
  gain.gain.setValueAtTime(0.00001, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(1, startCompletionTime);

  [squareOscillator, triangleOscillator, whiteNoise].forEach(o => o.start());
  return () => {
    gain.gain.cancelScheduledValues(context.currentTime);
    gain.gain.setValueAtTime(gain.gain.value, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 1);
    [squareOscillator, triangleOscillator, whiteNoise].forEach(o =>
      o.stop(context.currentTime + 1)
    );
  };
};

const noteToFreq = {
  a: 440,
  s: 493.88,
  d: 523.25,
  f: 587.33,
  g: 659.25,
  h: 698.46
};

let oscillators: { [key: string]: Array<() => void> } = {};
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
    const stop = createPad(context, noteToFreq[key]);
    oscillators[key].unshift(stop);
  });

  const clearKey = (key: string) => {
    if (isKey(key)) {
      const stop = oscillators[key].pop();
      if (!stop) {
        return;
      }
      stop();
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
