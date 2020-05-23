const sweepLength = 1;

export const createFlute = (
  context: AudioContext,
  freq: number
): (() => void) => {
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

export const createWhiteNoise = (context: AudioContext) => {
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

export const createPad = (
  context: AudioContext,
  freq: number
): (() => void) => {
  const squareOscillator = context.createOscillator();
  squareOscillator.frequency.value = freq;
  squareOscillator.type = "sawtooth";

  const triangleOscillator = context.createOscillator();
  triangleOscillator.frequency.value = freq - freq / 700;
  triangleOscillator.type = "triangle";

  const filter = context.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = freq * 1.5;

  const whiteNoise = createWhiteNoise(context);

  const whiteNoiseGain = context.createGain();
  whiteNoiseGain.gain.value = 0.1;
  whiteNoise.connect(whiteNoiseGain);

  [squareOscillator, triangleOscillator, whiteNoiseGain].forEach((o) =>
    o.connect(filter)
  );

  const gain = context.createGain();

  filter.connect(gain);

  gain.connect(context.destination);

  const startCompletionTime = context.currentTime + 0.05;
  gain.gain.setValueAtTime(0.00001, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(1, startCompletionTime);

  [squareOscillator, triangleOscillator, whiteNoise].forEach((o) => o.start());
  return () => {
    gain.gain.cancelScheduledValues(context.currentTime);
    gain.gain.setValueAtTime(gain.gain.value, context.currentTime);
    const endTime = context.currentTime + 3;
    gain.gain.exponentialRampToValueAtTime(0.0001, endTime);
    [squareOscillator, triangleOscillator, whiteNoise].forEach((o) =>
      o.stop(endTime)
    );
  };
};

const noteToFreq = {
  a: 440,
  s: 493.88,
  d: 523.25,
  f: 587.33,
  g: 659.25,
  h: 698.46,
};

let oscillators: { [key: string]: Array<() => void> } = {};
const isKey = (key: string): key is keyof typeof noteToFreq =>
  key in noteToFreq;

export const bindKeyboardListeners = () => {
  const context = new AudioContext();

  document.addEventListener("keydown", (e) => {
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

  document.addEventListener("keyup", (e) => {
    clearKey(e.key);
  });
};
