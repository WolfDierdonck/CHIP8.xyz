import React, { useState, useEffect, useRef } from 'react';

export const sizeMultiplier = 13;
export const canvasWidth = 64*sizeMultiplier;
export const canvasHeight = 32*sizeMultiplier;

export function useCanvas() {
    const canvasRef = useRef(null);

    return [ canvasRef, canvasWidth, canvasHeight, sizeMultiplier ];
}