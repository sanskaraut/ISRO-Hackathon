"use client";

import React from "react";
import { Layers, Activity, Eye } from "lucide-react";

interface ImageToolbarProps {
  playbackMode: "triad" | "compare";
  setPlaybackMode: (mode: "triad" | "compare") => void;
  cycloneId: string;
  satellite: string;
  hasInterp: boolean;
}

export default function ImageToolbar({
  playbackMode,
  setPlaybackMode,
  cycloneId,
  satellite,
  hasInterp
}: ImageToolbarProps) {
  return (
    <div className="bg-space-navy-900 border border-space-navy-850 p-2.5 rounded-lg flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-slate-400 select-none">
      
      {/* Target Tracker Info */}
      <div className="flex items-center space-x-2 shrink-0">
        <Activity className="h-4 w-4 text-cyan-accent" />
        <span className="font-bold text-slate-200">WORKSPACE VIEWER</span>
        <span className="text-slate-600">|</span>
        <span className="text-[11px] uppercase tracking-wider">
          Target: <span className="text-white font-semibold">{cycloneId || "STANDBY"}</span> ({satellite || "TIR"})
        </span>
      </div>

      {/* Workspace Display Modes */}
      <div className="flex items-center space-x-2">
        <span className="text-[10px] text-slate-500 uppercase mr-1">Display Mode:</span>
        
        {/* Triad Mode */}
        <button
          onClick={() => setPlaybackMode("triad")}
          className={`flex items-center space-x-1.5 px-3 py-1 rounded border text-[10px] uppercase font-bold transition-all cursor-pointer ${
            playbackMode === "triad"
              ? "bg-cyan-accent/15 border-cyan-accent text-cyan-accent"
              : "bg-space-navy-950 border-space-navy-850 text-slate-400 hover:border-slate-700 hover:text-slate-200"
          }`}
        >
          <Layers className="h-3.5 w-3.5" />
          <span>Triad View</span>
        </button>

        {/* Compare Mode */}
        <button
          onClick={() => hasInterp && setPlaybackMode("compare")}
          disabled={!hasInterp}
          className={`flex items-center space-x-1.5 px-3 py-1 rounded border text-[10px] uppercase font-bold transition-all ${
            !hasInterp
              ? "opacity-35 cursor-not-allowed border-transparent text-slate-600"
              : playbackMode === "compare"
              ? "bg-cyan-accent/15 border-cyan-accent text-cyan-accent"
              : "bg-space-navy-950 border-space-navy-850 text-slate-400 hover:border-slate-700 hover:text-slate-200 hover:cursor-pointer"
          }`}
          title={!hasInterp ? "Interpolate a frame first to unlock comparison playback" : "Compare original vs enhanced sequence"}
        >
          <Eye className="h-3.5 w-3.5" />
          <span>Synchronized Compare</span>
        </button>
      </div>

    </div>
  );
}
