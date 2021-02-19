import './App.css';
import * as chip8 from './Chip8.js';

function App() {
  let frequency = 300;
  let running = true;
  let keys = [];

  async function emulation() {
    chip8.initialize();
    await chip8.loadGame("breakout");

    while (running) {
      chip8.setKeys(keys);

      if (!chip8.awaitPress) {
        chip8.emulateCycle();

        if (chip8.drawFlag) {
          //draw
          chip8.removeDrawFlag();
        }
      }

      await new Promise(r => setTimeout(r, 1000/frequency));
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

  emulation();

  
  return (
    <div className="App">
      Test123
    </div>
  );
}

export default App;
