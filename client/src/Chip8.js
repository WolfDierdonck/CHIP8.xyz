import breakoutData from './games/breakout'

var keyStored;
var opcode;
var memory = new Uint8Array(4096);
var V = new Uint8Array(16);
var I;
var pc;
var delay_timer;
var sound_timer;
var stack = new Uint16Array(16);
var sp;
var keys = new Uint16Array(16); //uses ints as bools

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

function uint16 (n) {
    return n & 0xFFFF;
}


var gfx = new Uint8Array(64*32);
export var drawFlag;
export var awaitPress;

export function removeDrawFlag() {
    drawFlag = false;
}

export function getGFX() {
    return gfx;
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
    console.log(opcode.toString(16));

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
        if(sound_timer == 1)
            console.log("BEEP");

        --sound_timer;
    } 
}