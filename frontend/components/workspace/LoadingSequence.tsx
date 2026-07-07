"use client";

import React, { useState, useEffect } from "react";
import { Cpu } from "lucide-react";

interface LoadingSequenceProps {
  step?: number;
}

export default function LoadingSequence({ step = 0 }: LoadingSequenceProps) {
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState("Initializing inference engine...");

  // Mapping active generation steps to target progress percentiles
  const stepTargets = [12, 32, 58, 82, 95];
  const target = stepTargets[step] || 99;

  useEffect(() => {
    // Smoother interpolation toward target step percentile
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev < target) {
          // Accelerate growth if far from target
          const diff = target - prev;
          const stepSize = diff > 20 ? 3 : diff > 10 ? 2 : 1;
          return prev + stepSize;
        }
        return prev;
      });
    }, 45);

    // Rotate status messages based on active pipeline step
    if (step === 0) {
      setStatusMessage("Ingesting full-disk 5424 x 5424 NetCDF telemetry...");
    } else if (step === 1) {
      setStatusMessage("Normalizing thermal infrared brightness values...");
    } else if (step === 2) {
      setStatusMessage("Warping grids using bi-directional optical flow vectors...");
    } else if (step === 3) {
      setStatusMessage("Synthesizing intermediate observation frames...");
    } else if (step === 4) {
      setStatusMessage("Compiling final NetCDF grid and rendering PNG previews...");
    }

    return () => clearInterval(interval);
  }, [step, target]);

  return (
    <div className="flex flex-col items-center justify-center p-6 w-full h-full min-h-[300px] bg-space-navy-950/40 rounded-xl border border-space-navy-850 select-none relative overflow-hidden shadow-2xl">
      
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
            Processing Frame Sequence
          </h4>
        </div>

        {/* Progress Bar & Numerical readout */}
        <div className="space-y-2">
          <div className="flex items-center justify-between font-mono text-[9px] text-slate-500 uppercase">
            <span>Progress:</span>
            <span className="text-cyan-accent font-bold">{progress}%</span>
          </div>
          {/* Progress Bar Track */}
          <div className="h-2 w-full bg-space-navy-950 border border-space-navy-850 rounded-full overflow-hidden p-0.5">
            {/* Glowing progress line */}
            <div 
              style={{ width: `${progress}%` }} 
              className="h-full bg-cyan-accent rounded-full shadow-[0_0_8px_rgba(0,245,212,0.8)] transition-all duration-300 ease-out" 
            />
          </div>
        </div>

        {/* Dynamic Pipeline Steps */}
        <div className="bg-space-navy-900/80 p-3.5 rounded-xl border border-space-navy-850 font-mono text-[10px] text-left text-slate-400 min-h-[50px] flex items-center">
          <div className="flex items-start space-x-2.5">
            <span className="text-cyan-accent font-bold font-sans animate-pulse shrink-0">&raquo;</span>
            <span className="leading-relaxed transition-all duration-300">{statusMessage}</span>
          </div>
        </div>

        {/* Scientific estimate subtitle */}
        <p className="text-[9px] font-mono text-slate-500 max-w-[240px] mx-auto leading-normal">
          Inference is fully optimized: static background areas are bypassed automatically to save GPU cycle times.
        </p>

      </div>
    </div>
  );
}
