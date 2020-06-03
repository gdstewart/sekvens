import React, { Component } from "react";
import "./App.css";
import { motion } from "framer-motion"

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
    a: "#bde7ff",
    s: "#cdedff",
    d: "#dcf2ff",
    f: "#e9f7ff",
    g: "#f3fbff",
    h: "#FFFFFF"
}

/*
const noteToColor = {
    a: "#FFCCCC",
    s: "#FFCC99",
    d: "#FFFF99",
    f: "#CCFFCC",
    g: "#CCFFFF",
    h: "#CCCCFF"
}
*/

class Ripple extends Component<any, any> {
    private interval!: number;
    constructor(props: any) {
        super(props);
        this.state = {
            visible: true
        }
    }

    componentDidMount() {
        this.interval = window.setInterval(() => {
            this.setState({
                visible: false
            });
        }, 7000);
    }

    componentWillUnmount() {
        window.clearInterval(this.interval);
    }

    render() {
        if (this.state.visible) {
            return (
                <motion.ellipse
                    key={this.props.index}
                    animate={{ rx: window.innerWidth, ry: window.innerHeight, opacity: -1, cy: window.innerHeight / 2 + window.innerHeight / 4 }}
                    transition={{ duration: 20 }}
                    cx={window.innerWidth / 2}
                    cy={window.innerHeight / 1.5}
                    rx={0}
                    ry={0}
                    opacity={1}
                    style={{ stroke: this.props.color, strokeWidth: 5, fill: this.props.color, fillOpacity: 0.25, rotateX: "45deg" }}
                />
            )
        } else return null;
    }
}

export class Ripples extends Component<any, any> {
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
                    <Ripple color={ripple.color} index={index} />
                ))
            );
        } else
            return null;
    }
}