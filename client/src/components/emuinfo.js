import React, {useState, useEffect} from 'react';
import * as chip8 from '../Chip8.js'
import './emuinfo.css'

export default function EmuInfo() {
    const [value, setValue] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => setValue(Math.random(1)), 2);
    }, []);

    return(
        <div 
        className="outerDetails"
        >
          <div className="innerDetails">

            <p>
              V registers: <br/>
              [{Array.from(chip8.V).map(item => item.toString(16)).join(", ")}]
            </p>

            <p>
              Stack: <br/>
              [{Array.from(chip8.stack).map(item => item.toString(16)).join(", ")}]
            </p>

            <p>
              Keys: <br/>
              [{Array.from(chip8.keys).map(item => item ? "+" : "-").join(", ")}]
            </p>

            <div className="miscInfo">

              <p className="infoField">
                I: <br/>
                {chip8.I.toString(16)}
              </p>

              <p className="infoField">
                Program Counter: <br/>
                {chip8.pc.toString(16)}
              </p>

            </div>

            <div className="miscInfo">
              <p className="infoField">
                Delay Timer: <br/>
                {chip8.delay_timer}
              </p>

              <p className="infoField">
                Sound Timer: <br/>
                {chip8.sound_timer}
              </p>
            </div>

            <p style={{marginTop: "10px"}}>Instructions:</p>
            <p style={{lineHeight: "0.5"}}>{(chip8.memory[chip8.pc] << 8 | chip8.memory[chip8.pc + 1]).toString(16)} (current)</p>
            <p style={{lineHeight: "0.5", color: "lightgray", opacity: "0.75"}}>{(chip8.memory[chip8.pc+2] << 8 | chip8.memory[chip8.pc + 3]).toString(16)} (next)</p>
            <p style={{lineHeight: "0.5", color: "gray", opacity: "0.5"}}>{(chip8.memory[chip8.pc+4] << 8 | chip8.memory[chip8.pc + 5]).toString(16)} (2nd next)</p>
          </div>

        </div>
    );
}