import React, { useState, useEffect } from 'react';

import './App.css';
import { useCanvas } from './components/canvas.js';
import * as chip8 from './Chip8.js';
import * as emuCustom from './components/emucustom.js';
import EmuCustom from './components/emucustom.js';
import EmuInfo from './components/emuinfo.js';
import useForceUpdate from './components/emuinfo.js';


function App() {
  const [ canvasRef, canvasWidth, canvasHeight, sizeMultiplier ] = useCanvas();

  let keys = [];

  async function emulation() {
    chip8.initialize();
    await chip8.loadGame(emuCustom.gameName);
  }

  function singleCycle() {
    if(!emuCustom.running)
      return;

    let i = 0;
    while (i < emuCustom.iterateCount) {
    
      chip8.setKeys(keys);

      if (!chip8.awaitPress) {
        chip8.emulateCycle();

        if (chip8.drawFlag) {
          chip8.removeDrawFlag();

          let canvasObj = canvasRef.current;
          let ctx = canvasObj.getContext('2d');

          ctx.fillStyle = "black";
          ctx.fillRect(0, 0, canvasWidth, canvasHeight);

          ctx.fillStyle = "#" + emuCustom.color;
          for (let y = 0; y < 32; y++) {
            for (let x = 0; x < 64; x++) {
              if (chip8.gfx[y*64+x]) {   
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
      const interval = setInterval(singleCycle, 1000/emuCustom.freqStep);
      return () => clearInterval(interval);
  }, []);

  emulation();

  
  return (
    <div className="App">
      <div className="mainFlex">
        
        <EmuInfo/>

        <canvas 
          className="chip8Canvas"
          ref={canvasRef}
          width={canvasWidth}
          height={canvasHeight}
          />
      </div>

      <EmuCustom/>

    </div>
  );
}

export default App;
