import React, {useState, useEffect} from 'react';
import './emucustom.css'

import { makeStyles, ThemeProvider } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import Slider from '@material-ui/core/Slider';
import { createMuiTheme } from '@material-ui/core';
import Button from "@material-ui/core/Button";
import Select from 'react-select';
import * as chip8 from '../Chip8.js';

export const freqStep = 100;
export let frequency = 300;
export let iterateCount = Math.floor(frequency/freqStep);

export let running = true;

export let color = "FFFFFF";
export let gameName = "breakout";

const options = [
    { value: 'breakout', label: 'Breakout', color: "red" },
    { value: 'hidden', label: 'Hidden' },
    { value: 'hilo', label: 'High-Low' }
  ]

const selectStyle = {
    option: (provided, state) => ({
        ...provided,
        color: state.isSelected ? 'black' : 'gray'
    })
}

const theme = createMuiTheme({
    palette: {
      primary: {
        main: "#FFFFFF"
      },
    },
    typography: {
        fontFamily: 'code'
    }
  });

function gameChange(name) {
    running = false;
    gameName = name;
    chip8.initialize();
    chip8.loadGame(gameName);
    running = true;
}

function restart() {
    running = false;
    chip8.initialize();
    chip8.loadGame(gameName);
    running = true;
}

export default function EmuInfo() {

    return(
        <ThemeProvider theme={theme}>
        <div className="customOuter">
          <div className="customInner">
            <div className="instructionSpeed">

                <Typography id="discrete-slider" gutterBottom>
                    Instructions/Second
                </Typography>
                <Slider
                    defaultValue={300}
                    aria-labelledby="discrete-slider"
                    valueLabelDisplay="auto"
                    step={100}
                    marks
                    min={100}
                    max={1000}
                    color="primary"
                    onChange={ (e, val) => {
                        frequency = val;
                        iterateCount = Math.floor(frequency/freqStep);
                    }} 
                />
            </div>
          
            <div className="colorSelect">
                <p style={{marginBottom: "10px", marginTop: "10px", textAlign: "center"}}>Primary Pixel Color:</p>
                <div className="colors">
                    <Button onClick={() => color = "FFFFFF"} className="colorButton" variant="contained" style={{backgroundColor: "#FFFFFF"}}></Button>
                    <Button onClick={() => color = "46f4fc"} className="colorButton" variant="contained" style={{backgroundColor: "#46f4fc"}}></Button>
                    <Button onClick={() => color = "4472fc"} className="colorButton" variant="contained" style={{backgroundColor: "#4472fc"}}></Button>
                    <Button onClick={() => color = "f35292"} className="colorButton" variant="contained" style={{backgroundColor: "#f35292"}}></Button>
                    <Button onClick={() => color = "6ce819"} className="colorButton" variant="contained" style={{backgroundColor: "#6ce819"}}></Button>
                    
                </div>
            </div>

            <div className="gameSelect">
                <p style={{margin: "10px", textAlign: "center"}}>Current Game</p>
                <Select 
                options={options} 
                defaultValue={options[0]} 
                style={{color: "black", width: "100%"}} 
                styles={selectStyle}
                onChange={(value) => gameChange(value.value)}
                isSearchable={false}
                menuPlacement="top"/>
            </div>
          
            <Button onClick={() => running = false}className="controlButton" size="large" style={{backgroundColor: "#FFFFFF"}} variant="contained">Pause</Button>  
            <Button onClick={() => running = true}className="controlButton" size="large" style={{backgroundColor: "#FFFFFF"}} variant="contained">Resume</Button>
            <Button onClick={() => restart()}className="controlButton" size="large" style={{backgroundColor: "#FFFFFF"}} variant="contained">Restart</Button>
          </div>
        </div>
        </ThemeProvider>
    );
}