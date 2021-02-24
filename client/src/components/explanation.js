import React from 'react';
import './explanation.css'

export default function Explanation() {
    return(
        <div className="explanationOuter">
            <p className="header">
                Controls
            </p>

            <p className="subHeader">
                TL;DR
            </p>

            <p className="regular" style={{marginTop: "0px", textAlign: "center", lineHeight: "2"}}>
                <b>Breakout:</b> 'Q' - Move Left, 'E' - Move Right <br/>
                <b>Hidden:</b> '2' - Move Up, 'Q' - Move Left, 'E' - Move Right, 'S' - Move Down, 'W' - Select <br/>
                <b>High-Low:</b> '1' - 1, '2' - 2, '3' - 3, 'Q' - 4, 'W' - 5, 'E' - 6, 'A' - 7, 'S' - 8, 'D' - 9 <br/>
                <b>Space Invaders:</b> 'Q' - Move Left, 'E' - Move Right, 'W' - Shoot <br/>
                <b>Tetris:</b> 'Q' - Rotate Piece, 'W' - Move Left, 'E' - Move Right <br/>
                <b>Tic-Tac-Toe:</b> '1-D' - Place Piece (e.g. 'W' places piece in center)
            </p>

            <p className="subHeader">
                Wat?
            </p>

            <p className="regular" style={{textAlign: "center", lineHeight: "2"}}>
                The controls seem arbitrary at first, but that's due to how the original CHIP-8 was controlled. The CHIP-8 used a 4x4 keypad, with keys ranging from 0-F. <br/>
                In this emulator (and most others), the controls are mapped in the following way: <br/>
                <pre>
                    1  2  3  4  --{'>'}  1  2  3  C <br/>
                    Q  W  E  R  --{'>'}  4  5  6  D <br/>
                    A  S  D  F  --{'>'}  7  8  9  E <br/>
                    Z  X  C  V  --{'>'}  A  0  B  F <br/>
                </pre>

                Thus, when figuring out what the controls are for a specific game, trial-and-error works best!

            </p>
        </div>

    );
}