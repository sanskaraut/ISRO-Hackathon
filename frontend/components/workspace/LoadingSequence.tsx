"use client";

import React, { useState, useEffect } from "react";
import { Cpu } from "lucide-react";

export default function LoadingSequence() {
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState("Initializing inference engine...");

  // Progress simulation matching a realistic CPU-based full-disk run (~15 seconds)
  useEffect(() => {
    const startTime = Date.now();

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      
      // Asymptotic progress calculation (starts fast, slows down, never hits 100% until done)
      const pct = Math.min(Math.floor(99 * (1 - Math.exp(-elapsed / 10000))), 99);
      setProgress(pct);

      // Rotate status messages based on progress percentage
      if (pct < 15) {
        setStatusMessage("Ingesting full-disk 5424 x 5424 NetCDF telemetry...");
      } else if (pct < 30) {
        setStatusMessage("Normalizing thermal infrared brightness values...");
      } else if (pct < 45) {
        setStatusMessage("Decomposing canvas into 144 overlapping 512x512 patches...");
      } else if (pct < 85) {
        // Map pct from 45 to 85 onto 1 to 144 patches
        const ratio = (pct - 45) / 40; // 0 to 1
        const patchCount = Math.min(Math.floor(ratio * 144) + 1, 144);
        setStatusMessage(`Running batch inference: patch ${patchCount}/144 processed...`);
      } else if (pct < 95) {
        setStatusMessage("Blending overlapping blocks via 2D Hanning window...");
      } else {
        setStatusMessage("Compiling final NetCDF grid and rendering PNG previews...");
      }
    }, 100);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center p-6 w-full h-full min-h-[300px] bg-space-navy-950/40 rounded-lg border border-space-navy-900 select-none relative overflow-hidden">
      
      {/* Background scientific grid effect */}
      <div className="absolute inset-0 bg-[radial-gradient(rgba(0,245,212,0.02)_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

      <div className="z-10 w-full max-w-xs space-y-6 text-center">
        
        {/* Animated Icon */}
        <div className="flex justify-center">
          <div className="bg-cyan-accent/10 border border-cyan-accent/25 p-3 rounded-full relative animate-pulse">
            <Cpu className="h-6 w-6 text-cyan-accent" />
            <span className="absolute inset-0 rounded-full border border-cyan-accent/30 animate-ping opacity-45" />
          </div>
        </div>

        {/* Status header */}
        <div className="space-y-1">
          <span className="font-mono text-[9px] uppercase tracking-widest text-cyan-accent font-bold">
            [ INFERENCE ENGINE ACTIVE ]
          </span>
          <h4 className="font-heading text-xs font-bold text-white uppercase tracking-wider">
            Processing Full-Disk Sequence
          </h4>
        </div>

        {/* Progress Bar & Numerical readout */}
        <div className="space-y-2">
          <div className="flex items-center justify-between font-mono text-[9px] text-slate-500 uppercase">
            <span>Progress:</span>
            <span className="text-cyan-accent font-bold">{progress}%</span>
          </div>
          {/* Progress Bar Track */}
          <div className="h-1.5 w-full bg-space-navy-950 border border-space-navy-850 rounded-full overflow-hidden p-0.5">
            {/* Glowing progress line */}
            <div 
              style={{ width: `${progress}%` }} 
              className="h-full bg-cyan-accent rounded-full shadow-[0_0_8px_rgba(0,245,212,0.8)] transition-all duration-300 ease-out" 
            />
          </div>
        </div>

        {/* Dynamic Pipeline Steps */}
        <div className="bg-space-navy-900/80 p-3.5 rounded border border-space-navy-850 font-mono text-[10px] text-left text-slate-400 min-h-[50px] flex items-center">
          <div className="flex items-start space-x-2.5">
            <span className="text-cyan-accent font-bold font-sans animate-pulse shrink-0">&raquo;</span>
            <span className="leading-relaxed transition-all duration-300">{statusMessage}</span>
          </div>
        </div>

        {/* Scientific estimate subtitle */}
        <p className="text-[9px] font-mono text-slate-500 max-w-[240px] mx-auto leading-normal">
          Currently running 144 batch inferences on CPU. This will take approximately 15 seconds.
        </p>

      </div>
    </div>
  );
}
