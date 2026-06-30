"use client";

import React from "react";
import { motion } from "framer-motion";

interface TimelineProps {
  rawTimestamps: string[];
  generatedTimestamps: string[];
  selectedFrames: string[];
  setSelectedFrames: (frames: string[]) => void;
  currentTime: string;
  setCurrentTime: (time: string) => void;
  isGenerating: boolean;
  cyclone: any;
  playbackMode: "triad" | "compare";
}

// Convert timestamp (HH:MM or HH:MM:SS) to absolute minutes
const timeStrToMinutes = (timeStr: string): number => {
  const parts = timeStr.split(":");
  if (parts.length === 2) {
    return parseInt(parts[0]) * 60 + parseInt(parts[1]);
  } else if (parts.length === 3) {
    return parseInt(parts[0]) * 60 + parseInt(parts[1]) + parseInt(parts[2]) / 60;
  }
  return 0;
};

const minutesToTimeStr = (minutes: number): string => {
  const h = Math.floor(minutes / 60);
  const m = Math.floor(minutes % 60);
  const s = Math.round((minutes % 1) * 60);
  
  const pad = (n: number) => n.toString().padStart(2, "0");
  if (s > 0) {
    return `${pad(h)}:${pad(m)}:${pad(s)}`;
  }
  return `${pad(h)}:${pad(m)}`;
};

// Double-sweep collision resolution algorithm to prevent overlapping timeline nodes
const resolvePositions = (times: number[], minPercentGap: number = 8) => {
  const N = times.length;
  if (N === 0) return [];
  if (N === 1) return [50];
  
  const minTime = times[0];
  const maxTime = times[N - 1];
  const range = maxTime - minTime || 1;
  
  // 1. Raw proportional percentage positions
  let pos = times.map(t => ((t - minTime) / range) * 100);
  
  // 2. Left-to-right pass: push overlapping nodes to the right
  for (let i = 1; i < N; i++) {
    if (pos[i] - pos[i - 1] < minPercentGap) {
      pos[i] = pos[i - 1] + minPercentGap;
    }
  }
  
  // 3. Right-to-left pass: if pushed past 100%, push back to the left
  if (pos[N - 1] > 100) {
    pos[N - 1] = 100;
    for (let i = N - 2; i >= 0; i--) {
      if (pos[i + 1] - pos[i] < minPercentGap) {
        pos[i] = pos[i + 1] - minPercentGap;
      }
    }
  }
  
  // 4. Fallback constraint: if left node pushed below 0%, split evenly
  if (pos[0] < 0) {
    const gap = 100 / (N - 1 || 1);
    return times.map((_, idx) => idx * gap);
  }
  
  return pos;
};

export default function Timeline({
  rawTimestamps,
  generatedTimestamps,
  selectedFrames,
  setSelectedFrames,
  currentTime,
  setCurrentTime,
  isGenerating,
  cyclone,
  playbackMode
}: TimelineProps) {
  
  // 1. Sort all unique timestamps chronologically
  const sortedTimestamps = Array.from(
    new Set([...rawTimestamps, ...generatedTimestamps])
  ).sort((a, b) => timeStrToMinutes(a) - timeStrToMinutes(b));

  const minutesList = sortedTimestamps.map(timeStrToMinutes);
  
  // 2. Solve positions using collision avoidance
  const positions = resolvePositions(minutesList, 9); // 9% minimum visual gap (approx 54px on a 600px line)

  // 3. Handle simplified anchor selection sequence
  const handleNodeClick = (timestamp: string) => {
    if (isGenerating) return;

    // In Compare mode, clicking any node should just move the active playhead currentTime
    if (playbackMode === "compare") {
      setCurrentTime(timestamp);
      return;
    }

    // If clicked node is already in selectedFrames, remove it
    if (selectedFrames.includes(timestamp)) {
      const remaining = selectedFrames.filter((f) => f !== timestamp);
      setSelectedFrames(remaining);
      if (remaining.length === 1) {
        setCurrentTime(remaining[0]);
      } else {
        setCurrentTime(timestamp);
      }
      return;
    }

    // First clicked node ➔ Start Anchor
    if (selectedFrames.length === 0) {
      setSelectedFrames([timestamp]);
      setCurrentTime(timestamp);
    }
    // Second clicked node ➔ End Anchor
    else if (selectedFrames.length === 1) {
      const newSelection = [...selectedFrames, timestamp].sort(
        (a, b) => timeStrToMinutes(a) - timeStrToMinutes(b)
      );
      setSelectedFrames(newSelection);
      
      // Calculate midpoint and view it
      const tA = timeStrToMinutes(newSelection[0]);
      const tB = timeStrToMinutes(newSelection[1]);
      const tMid = tA + (tB - tA) * 0.5;
      setCurrentTime(minutesToTimeStr(tMid));
    }
    // Third clicked node ➔ Reset and set as new Start Anchor
    else {
      setSelectedFrames([timestamp]);
      setCurrentTime(timestamp);
    }
  };

  return (
    <div className="w-full bg-space-navy-950/20 border border-space-navy-900 rounded-lg p-6 flex flex-col space-y-8 select-none">
      
      {/* Dynamic guidance label */}
      <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 uppercase tracking-wider">
        <span>Anchor Selection State:</span>
        <span className="text-cyan-accent font-bold">
          {selectedFrames.length === 0
            ? "Click a node to set [START] anchor"
            : selectedFrames.length === 1
            ? "Click a second node to set [END] anchor"
            : "Anchors locked. Click 'Interpolate' above to run inference"}
        </span>
      </div>

      {/* Timeline track container */}
      <div className="h-16 relative w-full flex items-center px-4">
        
        {/* Horizontal track line */}
        <div className="absolute left-4 right-4 h-0.5 bg-space-navy-900 border-b border-space-navy-850" />

        {/* Nodes layer */}
        <div className="absolute left-4 right-4 inset-y-0">
          {sortedTimestamps.map((timestamp, index) => {
            const isRaw = rawTimestamps.includes(timestamp);
            const isSelectedStart = selectedFrames[0] === timestamp;
            const isSelectedEnd = selectedFrames[1] === timestamp;
            const isActive = currentTime === timestamp;
            
            const gtAvailable = !!cyclone?.ground_truth_availability?.[timestamp];
            const depth = isRaw 
              ? "Original" 
              : cyclone?.generated_metadata?.[timestamp]?.interpolation_depth !== undefined 
                ? `Depth ${cyclone.generated_metadata[timestamp].interpolation_depth}` 
                : "Depth 1";
            const tempRes = isRaw 
              ? "10 min" 
              : cyclone?.generated_metadata?.[timestamp]?.temporal_resolution || "5 min";

            const leftOffset = positions[index];

            return (
              <motion.div
                key={timestamp}
                layout
                style={{ left: `${leftOffset}%` }}
                className="absolute -translate-x-1/2 top-1/2 -translate-y-1/2 flex flex-col items-center z-10 group"
              >
                
                {/* START / END Labels (Framer Motion entry/exit) */}
                <div className="h-5 flex items-end justify-center mb-1">
                  {(isSelectedStart || isSelectedEnd) && (
                    <motion.span
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-[8px] font-mono font-black text-cyan-accent bg-cyan-accent/15 border border-cyan-accent/30 px-1 py-0.5 rounded leading-none"
                    >
                      {isSelectedStart ? "START" : "END"}
                    </motion.span>
                  )}
                </div>

                {/* Node Interactive Dot */}
                <button
                  onClick={() => handleNodeClick(timestamp)}
                  disabled={isGenerating}
                  className={`h-4.5 w-4.5 rounded-full flex items-center justify-center border transition-all duration-300 relative focus:outline-none ${
                    isActive
                      ? "ring-2 ring-white ring-offset-2 ring-offset-space-navy-950 scale-110 z-20"
                      : ""
                  } ${
                    isSelectedStart || isSelectedEnd
                      ? "bg-cyan-accent border-cyan-accent shadow-[0_0_8px_rgba(0,245,212,0.6)]"
                      : isRaw
                      ? "bg-space-navy-900 border-space-navy-700 hover:border-cyan-accent/60"
                      : "bg-space-navy-950 border-cyan-accent/50 border-dashed hover:border-cyan-accent"
                  }`}
                  title={`${timestamp} UTC (${isRaw ? "Raw Observation" : "AI Synthesized"})`}
                >
                  {/* Center Dot for Hollow style on generated frames */}
                  {!isRaw && !(isSelectedStart || isSelectedEnd) && (
                    <span className="h-1.5 w-1.5 rounded-full bg-cyan-accent/50" />
                  )}
                </button>

                {/* Time Label */}
                <span
                  className={`text-[9px] font-mono mt-1.5 transition-colors ${
                    isActive
                      ? "text-white font-bold"
                      : isSelectedStart || isSelectedEnd
                      ? "text-cyan-accent font-semibold"
                      : "text-slate-500"
                  }`}
                >
                  {timestamp}
                </span>

                {/* Subtitle label showing observation type */}
                <span className="text-[7px] font-mono text-slate-600 uppercase mt-0.5 leading-none">
                  {isRaw && generatedTimestamps.includes(timestamp) ? "RAW+AI" : isRaw ? "RAW" : "AI"}
                </span>

                {/* Hover Tooltip Overlay */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 bg-space-navy-950 border border-space-navy-800 text-[10px] font-mono text-slate-300 p-2.5 rounded shadow-2xl z-30 w-44 leading-relaxed opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 select-none">
                  <div className="text-cyan-accent font-bold border-b border-space-navy-850 pb-1 mb-1.5 flex items-center justify-between">
                    <span>{timestamp} UTC</span>
                    <span className="text-[8px] px-1 bg-cyan-accent/10 border border-cyan-accent/20 rounded">
                      {isRaw ? "RAW" : "AI"}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Source:</span>
                      <span className="text-slate-200 font-semibold">{isRaw ? "Satellite" : "RIFE Model"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">GT status:</span>
                      <span className={gtAvailable ? "text-emerald-400 font-bold" : "text-amber-400 font-bold"}>
                        {gtAvailable ? "✓ Available" : "⚠ Not Available"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Interp Depth:</span>
                      <span className="text-slate-200">{depth}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Resolution:</span>
                      <span className="text-slate-200">{tempRes}</span>
                    </div>
                  </div>
                </div>

              </motion.div>
            );
          })}
        </div>

      </div>

    </div>
  );
}
