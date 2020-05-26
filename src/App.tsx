import React, { Component } from "react";
import "./App.css";
import { bindKeyboardListeners } from "./instruments";
import { motion } from "framer-motion";

bindKeyboardListeners();

const isKey = (key: string): key is keyof typeof noteToFreq =>
	key in noteToFreq;

const noteToFreq = {
	a: 440,
	s: 493.88,
	d: 523.25,
	f: 587.33,
	g: 659.25,
	h: 698.46,
};

const noteToColor = {
	a: "#FFCCCC",
	s: "#FFCC99",
	d: "#FFFF99",
	f: "#CCFFCC",
	g: "#CCFFFF",
	h: "#CCCCFF"
}

class Ripples extends Component<any, any> {
	constructor(props: any) {
		super(props);
		this.state = {
			ripples: []
		}
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
						color: noteToColor[key]
					}
				)]
			}));
		});
	}

	render() {
		if (this.state.ripples != null) {
			return (
				this.state.ripples.map((ripple: any, index: number) => (
					<motion.ellipse
						key={index}
						animate={{ rx: window.innerWidth, ry: window.innerHeight, opacity: -1.5 }}
						transition={{ duration: 20 }}
						cx={window.innerWidth / 2}
						cy={window.innerHeight / 2}
						rx={0}
						ry={0}
						opacity={1}
						style={{ stroke: ripple.color, strokeWidth: 5 }}
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
			<svg height={window.innerHeight} width={window.innerWidth}>
				<Ripples />
			</svg>
		);
	}
};
