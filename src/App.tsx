import React, { Component } from "react";
import logo from "./logo.svg";
import "./App.css";
import { createSecureContext } from "tls";
import { create } from "domain";
import { bindKeyboardListeners } from "./instruments";
import { Stage, Layer, Ellipse } from "react-konva";
import CSSTransitionGroup from "react-transition-group";

bindKeyboardListeners();

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

const noteToColor = {
	a: "#FFCCCC",
	s: "#FFCC99",
	d: "#FFFF99",
	f: "#CCFFCC",
	g: "#CCFFFF",
	h: "#CCCCFF"
}

class Ripple extends Component<any, any> {
	constructor(props: any) {
		super(props);
		this.state = {
			ripples: []
		};
	}

	componentDidMount() {
		document.addEventListener("keydown", e => {
			const key = e.key;
			if (!isKey(key)) {
				return;
			}
			this.setState((prevState: any) => ({
				ripples: [...prevState.ripples, (
					{
						color: noteToColor[key],
						radiusX: 0,
						radiusY: 0
					}
				)]
			}));
		});

	}

	render() {
		if (this.state.ripples != null) {
			return (
				this.state.ripples.map((ripple: any) => (
					<Ellipse
						x={window.innerWidth / 2}
						y={window.innerHeight / 2}
						radiusX={0}
						radiusY={0}
						stroke={ripple.color}
						shadowBlur={5}
					/>
				))
			);
		} else
			return null;
	}
}

export default class App extends Component {
	render() {
		return (
			<Stage width={window.innerWidth} height={window.innerHeight} >
				<Layer>
					<Ripple />
				</Layer>
			</Stage>
		);
	}
};
