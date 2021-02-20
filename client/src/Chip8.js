import breakoutData from './games/breakout'

var keyStored;
var opcode;
export var memory = new Uint8Array(4096);
export var V = new Uint8Array(16);
export var I;
export var pc;
export var delay_timer;
export var sound_timer;
export var stack = new Uint16Array(16);
var sp;
export var keys = new Uint16Array(16); //uses ints as bools

var chip8_fontset = new Uint8Array(
    [0xF0, 0x90, 0x90, 0x90, 0xF0, // 0
    0x20, 0x60, 0x20, 0x20, 0x70, // 1
    0xF0, 0x10, 0xF0, 0x80, 0xF0, // 2
    0xF0, 0x10, 0xF0, 0x10, 0xF0, // 3
    0x90, 0x90, 0xF0, 0x10, 0x10, // 4
    0xF0, 0x80, 0xF0, 0x10, 0xF0, // 5
    0xF0, 0x80, 0xF0, 0x90, 0xF0, // 6
    0xF0, 0x10, 0x20, 0x40, 0x40, // 7
    0xF0, 0x90, 0xF0, 0x90, 0xF0, // 8
    0xF0, 0x90, 0xF0, 0x10, 0xF0, // 9
    0xF0, 0x90, 0xF0, 0x90, 0x90, // A
    0xE0, 0x90, 0xE0, 0x90, 0xE0, // B
    0xF0, 0x80, 0x80, 0x80, 0xF0, // C
    0xE0, 0x90, 0x90, 0x90, 0xE0, // D
    0xF0, 0x80, 0xF0, 0x80, 0xF0, // E
    0xF0, 0x80, 0xF0, 0x80, 0x80]  // F
)

export var gfx = new Uint8Array(64*32);
export var drawFlag;
export var awaitPress;

export function removeDrawFlag() {
    drawFlag = false;
}

export function initialize() {
    pc = 0x200;
    opcode = 0;
    I = 0;
    sp = 0;

    gfx.fill(0);
    stack.fill(0);
    V.fill(0);
    memory.fill(0);

    for (var i = 0; i < 80; i++) {
        memory[i] = chip8_fontset[i];
    }

    delay_timer = 0;
    sound_timer = 0;
    drawFlag = false;
    awaitPress = false;
}

export async function loadGame(game) {
    console.log(game);
    let module = await import('./games/' + game);

    var output = module.default.split(" ").map(item => parseInt(item, 16));

    for (var i = 0; i < output.length; i++) {
        memory[i+512] = output[i];
    }
}

export function setKeys(inputs) {
    keys[1] = inputs["1"];
    keys[2] = inputs["2"];
    keys[3] = inputs["3"];
    keys[0xC] = inputs["4"];
    keys[4] = inputs["q"];
    keys[5] = inputs["w"];
    keys[6] = inputs["e"];
    keys[0xD] = inputs["r"];
    keys[7] = inputs["a"];
    keys[8] = inputs["s"];
    keys[9] = inputs["d"];
    keys[0xE] = inputs["f"];
    keys[0xA] = inputs["z"];
    keys[0] = inputs["x"];
    keys[0xB] = inputs["c"];
    keys[0xF] = inputs["v"];
   
    for (var i = 0; i < 16; i++) {
        if (keys[i] && awaitPress) {
            V[keyStored] = i;
            awaitPress = false;
        }
    }
}

export function emulateCycle() {
    opcode = memory[pc] << 8 | memory[pc + 1];

    switch(opcode & 0xF000)
    {    
        case 0x0000:
            switch(opcode & 0x000F)
            {
                case 0x0000:  {// 0x00E0: Clears the screen        
                    gfx.fill(0);
                    pc += 2;
                    break;
                }
            
                case 0x000E: { // 0x00EE: Returns from subroutine          
                    sp--;
                    pc = stack[sp];
                    pc+=2;
                    break;  
                }      
            }
            break;

        case 0x1000: { // 1NNN: Jumps to address NNN
            pc = opcode & 0x0FFF;
            break;
        }

        case 0x2000:  { // 2NNN: Calls subroutine at NNN
            stack[sp] = pc;
            sp++;
            pc = opcode & 0x0FFF;
            break;
        }

        case 0x3000: { // 3XNN: Skips next instruction if VX equals NN
            if (V[(opcode & 0x0F00) >> 8] == (opcode & 0x00FF)) {
                pc += 2;
            }
            pc += 2;
            break;
        }
        
        case 0x4000: { // 4XNN: Skips next instruction if VX doesnt equal NN
            if (V[(opcode & 0x0F00) >> 8] != (opcode & 0x00FF)) {
                pc += 2;
            }
            pc += 2;
            break;
        }
        
        case 0x5000: { // 5XY0: Skips next instruction if VX equal VY
            if (V[(opcode & 0x0F00) >> 8] == V[(opcode & 0x00F0) >> 4]) {
                pc += 2;
            }
            pc += 2;
            break;
        }
        
        case 0x6000: { // 6XNN: Sets VX to NN
            V[(opcode & 0x0F00) >> 8] = opcode & 0x00FF;
            pc += 2;
            break;
        }
        
        case 0x7000: { // 7XNN: Adds NN to VX (carry isnt changed)
            V[(opcode & 0x0F00) >> 8] += opcode & 0x00FF;
            pc += 2;
            break;
        }
        
        case 0x8000: {
            switch(opcode & 0x000F)
            {
                case 0x0000: // 8XY0: Sets VX to the value of VY
                    V[(opcode & 0x0F00) >> 8] = V[(opcode & 0x00F0) >> 4];
                    pc += 2;
                    break;
                
                case 0x0001: // 8XY1: Sets VX to VX|VY
                    V[(opcode & 0x0F00) >> 8] = V[(opcode & 0x0F00) >> 8]|V[(opcode & 0x00F0) >> 4];
                    pc += 2;
                    break;
                
                case 0x0002: // 8XY2: Sets VX to VX&VY
                    V[(opcode & 0x0F00) >> 8] = V[(opcode & 0x0F00) >> 8]&V[(opcode & 0x00F0) >> 4];
                    pc += 2;
                    break;

                case 0x0003: // 8XY3: Sets VX to VX^VY
                    V[(opcode & 0x0F00) >> 8] = V[(opcode & 0x0F00) >> 8]^V[(opcode & 0x00F0) >> 4];
                    pc += 2;
                    break;
                
                case 0x0004: // 8XY4: Adds VY to VX. VF is set to 1 when there's a carry
                    if(V[(opcode & 0x00F0) >> 4] > (0xFF - V[(opcode & 0x0F00) >> 8]))
                        V[0xF] = 1;
                    else
                        V[0xF] = 0;
                    V[(opcode & 0x0F00) >> 8] += V[(opcode & 0x00F0) >> 4];
                    pc += 2;          
                    break;
                
                case 0x0005: // 8XY5: VY is subtracted from VX. VF is set to 0 when there's a borrow
                    if(V[(opcode & 0x00F0) >> 4] > (V[(opcode & 0x0F00) >> 8]))
                        V[0xF] = 0;
                    else
                        V[0xF] = 1;
                    V[(opcode & 0x0F00) >> 8] -= V[(opcode & 0x00F0) >> 4];
                    pc += 2; 
                    break;
                
                case 0x0006: // 8XY6: Stores the least significant bit of VX in VF and then shifts VX to the right by 1
                    V[0xF] = V[(opcode & 0x0F00) >> 8] & 1;
                    V[(opcode & 0x0F00) >> 8] >>=1;
                    pc+=2;
                    break;
                
                case 0x0007: // 8XY7: Sets VX to VY minus VX. VF is set to 0 when there's a borrow
                    if(V[(opcode & 0x00F0) >> 4] < (V[(opcode & 0x0F00) >> 8]))
                            V[0xF] = 0;
                        else
                            V[0xF] = 1;
                    V[(opcode & 0x0F00) >> 8] = V[(opcode & 0x00F0) >> 4]-V[(opcode & 0x0F00) >> 8];
                    pc += 2; 
                    break;
                
                case 0x000E: // 8XYE: Stores the most significant bit of VX in VF and then shifts VX to the left by 1
                    V[0xF] = V[(opcode & 0x0F00) >> 8] & 0b10000000;
                    V[(opcode & 0x0F00) >> 8] <<=1;
                    pc+=2;
                    break;
            }
            break;
        }
        
        case 0x9000: { // 9XY0: Skips next instruction if VX doesnt equal VY
            if (V[(opcode & 0x0F00) >> 8] != V[(opcode & 0x00F0) >> 4]) {
                pc += 2;
            }
            pc += 2;
            break;
        }

        case 0xA000: { // ANNN: Sets I to the address NNN
            I = opcode & 0x0FFF;
            pc += 2;
            break;
        }
        
        case 0xB000: { // BNNN: Jumps to address NNN plus V0
            pc = (opcode & 0x0FFF) + V[0];
            pc += 2;
            break;
        }
        
        case 0xC000: { // CXNN: Sets VX to the result of a bitwise AND on a random number (0 to 255) and NN
            V[(opcode & 0x0F00) >> 8] = Math.floor((Math.random() * 256)) & (opcode & 0x00FF);
            pc+=2;
            break;
        }
        
        case 0xD000: { // DXYN:
            /* Draws a sprite at coordinate (VX, VY) that has a width of 8 pixels and a height of N+1 pixels. 
            Each row of 8 pixels is read as bit-coded starting from memory location I; I value doesn’t change after the execution of this instruction. 
            As described above, VF is set to 1 if any screen pixels are flipped from set to unset when the sprite is drawn, and to 0 if that doesn’t happen */
             
            let x = V[(opcode & 0x0F00) >> 8];
            let y = V[(opcode & 0x00F0) >> 4];
            let height = opcode & 0x000F;
            let pixel;
            
            V[0xF] = 0;
            for (let yline = 0; yline < height; yline++) {
                pixel = memory[I + yline];
                for(let xline = 0; xline < 8; xline++) {
                    if((pixel & (0x80 >> xline)) != 0) { //if pixel in new sprite is 1
                        if(gfx[(x + xline + ((y + yline) * 64)) % (64 * 32)] == 1)
                            V[0xF] = 1;                                 
                        gfx[(x + xline + ((y + yline) * 64)) % (64 * 32)] ^= 1; 
                    }
                }
            }

            drawFlag = true;
            pc += 2;
            break;
        }
        
        case 0xE000: {
            switch(opcode & 0x000F) {
                case 0x000E: { // EX9E: Skips next instruction if key stored in VX is pressed
                    if(keys[V[(opcode & 0x0F00) >> 8]])
                        pc += 4;
                    else
                        pc += 2;
                    
                    break;
                }
                
                case 0x0001: { // EXA1: Skips next instruction if key stored in VX isnt pressed
                    //std::cout << V[(opcode & 0x0F00) >> 8] << std::endl;
                    //std::cout << "key: " << std::hex << V[(opcode & 0x0F00) >> 8] << std::endl;
                    if(!keys[V[(opcode & 0x0F00) >> 8]])
                            pc += 4;
                    else
                        pc += 2;
                    break;
                }
            }
            break;
        }
        
        case 0xF000: {
            switch(opcode & 0x00F0) {
                case 0x0000: {
                    switch(opcode & 0x000F) {
                        case 0x0007: { // FX07: Sets VX to the value of the delay timer
                            V[(opcode & 0x0F00) >> 8] = delay_timer;
                            pc += 2;
                            break;
                        }

                        case 0x000A: { // FX0A: A key press is awaited and then stored in VX (all instruction halted until next key event)
                            awaitPress = true;
                            keyStored = (opcode & 0x0F00) >> 8;
                            pc += 2;
                            break;
                        }
                    }
                    break;
                }
                
                case 0x0010: {
                    switch(opcode & 0x000F) {
                        case 0x0005: { // FX15: Sets delay timer to VX
                            delay_timer = V[(opcode & 0x0F00) >> 8];
                            pc += 2;
                            break;
                        }

                        case 0x0008: { // FX18: Sets sound timer to VX
                            sound_timer = V[(opcode & 0x0F00) >> 8];
                            pc += 2;
                            break;
                        }
                        
                        case 0x000E: { // FX1E: Adds VX to I
                            I += V[(opcode & 0x0F00) >> 8];
                            pc += 2;
                            break;
                        }
                    }
                    break;
                }
                
                case 0x0020: { // FX29: Sets I to the location of the sprite for the character in VX. Character 0-F are represented by a 4x5 font
                    I = 5*V[(opcode & 0x0F00) >> 8];
                    pc += 2;
                    break;
                }
                
                case 0x0030: { // FX33:
                    /* Stores the binary-coded decimal representation of VX, with the most 
                    significant of three digits at the address in I, the middle digit at I plus 1, 
                    and the least significant digit at I plus 2. (In other words, take the decimal 
                    representation of VX, place the hundreds digit in memory at location in I, the 
                    tens digit at location I+1, and the ones digit at location I+2.) */
                    memory[I]     = V[(opcode & 0x0F00) >> 8] / 100;
                    memory[I + 1] = (V[(opcode & 0x0F00) >> 8] / 10) % 10;
                    memory[I + 2] = (V[(opcode & 0x0F00) >> 8] % 100) % 10;
                    pc += 2;
                    break;
                }
                
                case 0x0050: { // FX55: Stores V0 to VX (including VX) in memory starting at adress I. The offset from I is increased by 1 for each value written, but I itself is left unmodified
                    let max = (opcode & 0x0F00) >> 8;
                    for (let i = 0; i <= max; i++) {
                        memory[I+i] = V[i];
                    }
                    pc += 2;
                    break;
                }
                
                case 0x0060: { // FX65: Fills V0 to VX (including VX) with values from memory starting at adress I.
                    let max = (opcode & 0x0F00) >> 8;
                    for (let i = 0; i <= max; i++) {
                        V[i] = memory[I+i];
                    }
                    pc += 2;
                    break;    
                }
            }
            break;
        }
    
    }  

    if(delay_timer > 0)
        delay_timer--;
    
    if(sound_timer > 0)
    {
        if(sound_timer == 1) {
            var audio = new Audio('data:audio/mpeg;base64,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9qu3RGtxu33q9n6MQfVHBtlFvPrYWLT+TwL7vWcH7NvFsmluHTtOdshAgQyOo0/exlczL+6cyJJA8k1kHu3q//tSxOCACMEDCKioTcGEq+H01BcJ7Ju4WtfoAzudNc8jJCR4cpPRLs8//NKaf5GKZPtOflVbh64JcE2SF5QsF738Jc/0Jqb9Tz7kPwv6+94VEHv9uQopQmv4rvqQwCSSz4plE0FDnVFigZN6+eN7dqd4y2muAeqohbpXCQeZWh70JcZaldVT1sJPoCjx0Slootlm6dmpmQHKbAQVFXl6UmXWiUAAAWVmNttyiIeIoslOMiKTAYaqVWMq4Y2dYziWM/1hqX7UYM6mFQVS+bVYfkH/+1LE5QAIoHsXpQTWQQaO5HxwnWRQUpQ1nrGpM5+sNUFRv+GpgMFKTe1Es5frGUmNUX+kxrekxgKCoKqw1+7XyamFGAnEz4ZfKU+GqCqJFPxVTEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/7UsT/gArliyfllFahrjDisPWNvVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//tSxPwACkh7HUWEzOGoMaC0kwwlVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVU=');
            console.log("BEEP");
            audio.play();
        }

        --sound_timer;
    } 
}