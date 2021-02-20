import React, { useState, useEffect } from 'react';

import './App.css';
import { useCanvas } from './components/canvas';
import * as chip8 from './Chip8.js';

function App() {
  const [ canvasRef, canvasWidth, canvasHeight, sizeMultiplier ] = useCanvas();

  const freqStep = 100; //min is 25
  let frequency = 100;
  let iterateCount = Math.floor(frequency/freqStep);

  let running = true;
  let keys = [];

  async function emulation() {
    chip8.initialize();
    await chip8.loadGame("hilo");
  }

  function singleCycle() {
    if(!running)
      return;

    let i = 0;
    while (i < iterateCount) {
    
      chip8.setKeys(keys);

      if (!chip8.awaitPress) {
        chip8.emulateCycle();

        if (chip8.drawFlag) {
          chip8.removeDrawFlag();
          console.log("chip 8 gfx below");
          console.log(chip8.getGFX().reduce((a, b) => a + b, 0));

          let canvasObj = canvasRef.current;
          let ctx = canvasObj.getContext('2d');

          ctx.fillStyle = "black";
          ctx.fillRect(0, 0, canvasWidth, canvasHeight);

          ctx.fillStyle = "white";
          for (let y = 0; y < 32; y++) {
            for (let x = 0; x < 64; x++) {
              if (chip8.getGFX()[y*64+x]) {   
                ctx.fillRect(x*sizeMultiplier, y*sizeMultiplier, sizeMultiplier, sizeMultiplier);
              }
            }
          }
        }
      }

      i+=1;
    }
  }

  window.addEventListener("keydown",
      function(e){
          keys[e.key] = true;
      },
  false);

  window.addEventListener('keyup',
      function(e){
          keys[e.key] = false;
      },
  false);

  useEffect(() => {
    if (running) {
      const interval = setInterval(singleCycle, 1000/freqStep);
      return () => clearInterval(interval);
    }
  }, []);

  emulation();

  
  return (
    <div className="App">
      <div className="mainFlex">
        <div 
        className="test"
        height={canvasHeight}></div>

        <canvas 
          className="chip8Canvas"
          ref={canvasRef}
          width={canvasWidth}
          height={canvasHeight}
          />
      </div>

    <div className="customization"></div>

    </div>
  );
}

export default App;
