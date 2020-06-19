import React, { Component } from "react";
import "./App.css";
import { bindKeyboardListeners } from "./instruments";
import { Ripples } from "./effects";

bindKeyboardListeners();

export default class App extends Component {
	render() {
		return (
			<svg height={window.innerHeight} width={window.innerWidth}>
				<Ripples />
			</svg>
		);
	}
};
