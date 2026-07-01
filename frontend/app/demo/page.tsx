"use client";

import React, { useState, useEffect } from "react";
import SectionContainer from "@/components/common/SectionContainer";
import Button from "@/components/ui/Button";
import ImagePanel from "@/components/workspace/ImagePanel";
import ImageToolbar from "@/components/workspace/ImageToolbar";
import LoadingSequence from "@/components/workspace/LoadingSequence";
import Lightbox from "@/components/workspace/Lightbox";
import Timeline from "@/components/workspace/Timeline";
import UploadWorkspace from "@/components/workspace/UploadWorkspace";
import ScientificComparisonWorkspace from "@/components/workspace/ScientificComparisonWorkspace";
import { getApiUrl } from "@/utils/api";
import {
  Cpu,
  Layers,
  Database,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Sparkle,
  CheckCircle,
  Clock,
  Gauge,
  HelpCircle,
  Upload
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Local fallbacks in case the backend is offline
const FALLBACK_CYCLONES = [
  {
    id: "AMPHAN",
    name: "Cyclone Amphan (2020)",
    basin: "Bay of Bengal",
    satellite: "INSAT-3DS",
    frames: [
      { timestamp: "01:00", nc_path: "datasets/GOES19/AMPHAN/0100.nc", png_path: "datasets/GOES19/AMPHAN/0100.png" },
      { timestamp: "01:30", nc_path: "datasets/GOES19/AMPHAN/0130.nc", png_path: "datasets/GOES19/AMPHAN/0130.png" },
      { timestamp: "02:00", nc_path: "datasets/GOES19/AMPHAN/0200.nc", png_path: "datasets/GOES19/AMPHAN/0200.png" },
      { timestamp: "02:30", nc_path: "datasets/GOES19/AMPHAN/0230.nc", png_path: "datasets/GOES19/AMPHAN/0230.png" },
      { timestamp: "03:00", nc_path: "datasets/GOES19/AMPHAN/0300.nc", png_path: "datasets/GOES19/AMPHAN/0300.png" }
    ]
  },
  {
    id: "BIPARJOY",
    name: "Cyclone Biparjoy (2023)",
    basin: "Arabian Sea",
    satellite: "INSAT-3DS",
    frames: [
      { timestamp: "01:00", nc_path: "datasets/GOES19/BIPARJOY/0100.nc", png_path: "datasets/GOES19/BIPARJOY/0100.png" },
      { timestamp: "01:30", nc_path: "datasets/GOES19/BIPARJOY/0130.nc", png_path: "datasets/GOES19/BIPARJOY/0130.png" },
      { timestamp: "02:00", nc_path: "datasets/GOES19/BIPARJOY/0200.nc", png_path: "datasets/GOES19/BIPARJOY/0200.png" },
      { timestamp: "02:30", nc_path: "datasets/GOES19/BIPARJOY/0230.nc", png_path: "datasets/GOES19/BIPARJOY/0230.png" },
      { timestamp: "03:00", nc_path: "datasets/GOES19/BIPARJOY/0300.nc", png_path: "datasets/GOES19/BIPARJOY/0300.png" }
    ]
  }
];

// Helper to convert time HH:MM or HH:MM:SS to absolute minutes
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

// Find the closest two timestamps in the timeline that average exactly to the target timestamp
const findParents = (target: string, allTimestamps: string[]): { parentA: string; parentB: string } => {
  const tMins = timeStrToMinutes(target);
  let bestA = "";
  let bestB = "";
  let minDistance = Infinity;

  for (let i = 0; i < allTimestamps.length; i++) {
    for (let j = i + 1; j < allTimestamps.length; j++) {
      const a = allTimestamps[i];
      const b = allTimestamps[j];
      const aMins = timeStrToMinutes(a);
      const bMins = timeStrToMinutes(b);
      
      if (Math.abs((aMins + bMins) / 2 - tMins) < 0.01) {
        const distance = bMins - aMins;
        if (distance < minDistance) {
          minDistance = distance;
          bestA = a;
          bestB = b;
        }
      }
    }
  }

  return { parentA: bestA, parentB: bestB };
};

export default function DemoPage() {
  // --- STATE FOR DATA AND TARGET SELECTION ---
  const [dataset, setDataset] = useState("INSAT-3DS");
  const [cyclones, setCyclones] = useState<any[]>(FALLBACK_CYCLONES);
  const [cyclone, setCyclone] = useState<any>(FALLBACK_CYCLONES[0]);
  const [selectedFrames, setSelectedFrames] = useState<string[]>(["01:00", "02:00"]);
  const [generatedFrames, setGeneratedFrames] = useState<Record<string, any>>({});

  // --- STATE FOR INTERPOLATION PIPELINE ---
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState(0);
  const [isInterpolated, setIsInterpolated] = useState(false);
  const [interpolationResult, setInterpolationResult] = useState<any>(null);

  // --- PLAYBACK AND SELECTION STATES ---
  const [currentTime, setCurrentTime] = useState("01:00");
  const [playbackMode, setPlaybackMode] = useState<"triad" | "compare">("triad");
  const [centerViewMode, setCenterViewMode] = useState<"ai" | "raw">("ai");
  const [viewMode, setViewMode] = useState<"database" | "upload">("database");

  // --- LIGHTBOX CONTROL ---
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [zoomedTitle, setZoomedTitle] = useState<string>("");

  // --- FETCH DATASETS ON MOUNT ---
  useEffect(() => {
    const loadBackendData = async () => {
      try {
        const res = await fetch(getApiUrl("/cyclones"));
        if (res.ok) {
          const data = await res.json();
          if (data && data.length > 0) {
            setCyclones(data);
            setCyclone(data[0]);
            setDataset(data[0].satellite); // Synchronize dataset selector on initial load
            
            if (data[0].frames && data[0].frames.length >= 3) {
              const fA = data[0].frames[0].timestamp;
              const fB = data[0].frames[2].timestamp;
              setSelectedFrames([fA, fB]);
              const tA = timeStrToMinutes(fA);
              const tB = timeStrToMinutes(fB);
              const tMid = tA + (tB - tA) * 0.5;
              setCurrentTime(minutesToTimeStr(tMid));
            }
          }
        }
      } catch (err) {
        console.warn("FastAPI backend is offline. Using local simulated datasets.");
      }
    };
    loadBackendData();
  }, []);

  // Update selection defaults when changing selected cyclone
  useEffect(() => {
    if (cyclone && cyclone.frames && cyclone.frames.length >= 3) {
      const fA = cyclone.frames[0].timestamp;
      const fB = cyclone.frames[2].timestamp;
      setSelectedFrames([fA, fB]);
      const tA = timeStrToMinutes(fA);
      const tB = timeStrToMinutes(fB);
      const tMid = tA + (tB - tA) * 0.5;
      setCurrentTime(minutesToTimeStr(tMid));
      setGeneratedFrames({});
      setIsInterpolated(false);
      setInterpolationResult(null);
    }
  }, [cyclone]);

  // Reset interpolation states when anchors change to prevent showing stale or broken midpoints
  useEffect(() => {
    setIsInterpolated(false);
    setInterpolationResult(null);
  }, [selectedFrames]);

  useEffect(() => {
    setCenterViewMode("ai");
  }, [currentTime]);

  // Filter cyclones belonging to selected Satellite
  const filteredCyclones = cyclones.filter(
    (c) => c.satellite.toUpperCase() === dataset.toUpperCase()
  );

  // Dynamic timeline parameters
  const rawTimestamps = cyclone?.frames ? cyclone.frames.map((f: any) => f.timestamp) : [];
  const generatedTimestamps = Array.from(new Set([
    ...Object.keys(generatedFrames),
    ...(cyclone?.generated_frames || [])
  ]));

  // Compute minimum temporal interval to display active resolution dynamically
  const getTemporalResolutionLabel = () => {
    const sorted = Array.from(
      new Set([...rawTimestamps, ...generatedTimestamps])
    ).sort((a, b) => timeStrToMinutes(a) - timeStrToMinutes(b));

    if (sorted.length < 2) return "30 min";
    
    let minGap = Infinity;
    for (let i = 1; i < sorted.length; i++) {
      const gap = timeStrToMinutes(sorted[i]) - timeStrToMinutes(sorted[i - 1]);
      if (gap > 0 && gap < minGap) {
        minGap = gap;
      }
    }

    if (minGap === 30) return "30 min";
    if (minGap === 15) return "15 min";
    if (minGap === 7.5) return "7.5 min";
    if (minGap === 3.75) return "3.75 min";
    return `${minGap.toFixed(2)} min`;
  };

  const temporalResolution = getTemporalResolutionLabel();

  const getEnhancementLabel = () => {
    if (selectedFrames.length !== 2) return "30 min \u2192 15 min";
    const delta = timeStrToMinutes(selectedFrames[1]) - timeStrToMinutes(selectedFrames[0]);
    const halfDelta = delta * 0.5;
    const formatDelta = (val: number) => Number.isInteger(val) ? val.toString() : val.toFixed(1);
    return `${formatDelta(delta)} min \u2192 ${formatDelta(halfDelta)} min`;
  };

  const getSurroundingAnchors = (timeStr: string): [string | null, string | null] => {
    if (!cyclone || !cyclone.frames) return [null, null];
    const rawTimes = rawTimestamps;
    const targetMin = timeStrToMinutes(timeStr);
    
    let preceding: string | null = null;
    let succeeding: string | null = null;
    
    for (const rt of rawTimes) {
      const rtMin = timeStrToMinutes(rt);
      if (rtMin < targetMin) {
        preceding = rt;
      } else if (rtMin > targetMin && !succeeding) {
        succeeding = rt;
      }
    }
    return [preceding, succeeding];
  };

  const getInterpolationDepth = (timeStr: string): number => {
    if (rawTimestamps.includes(timeStr)) return 0;
    const [a, b] = getSurroundingAnchors(timeStr);
    if (!a || !b) return 1;
    const diffA = timeStrToMinutes(timeStr) - timeStrToMinutes(a);
    const delta = timeStrToMinutes(b) - timeStrToMinutes(a);
    if (delta === 0) return 1;
    const ratio = diffA / delta;
    if (Math.abs(ratio - 0.5) < 0.01) return 1;
    return 2;
  };

  const getFrameTemporalResolution = (timeStr: string): string => {
    if (rawTimestamps.includes(timeStr)) return "10 min (Native)";
    const depth = getInterpolationDepth(timeStr);
    if (depth === 1) return "5 min (AI Enhanced)";
    if (depth === 2) return "2.5 min (AI Enhanced)";
    return "AI Enhanced";
  };

  // Trigger backend interpolation
  const handleInterpolate = async () => {
    if (selectedFrames.length !== 2) return;
    
    setIsGenerating(true);
    setGenerationStep(0);

    // Minor step highlights for visual pipeline tracking during request lifecycle
    const stages = [
      () => setGenerationStep(1), // Ingestion -> Normalization
      () => setGenerationStep(2), // Normalization -> Optical Flow
      () => setGenerationStep(3), // Optical Flow -> Frame Synthesis
      () => setGenerationStep(4)  // Frame Synthesis -> Compilation
    ];

    const timeouts = stages.map((stepFn, index) => {
      return setTimeout(stepFn, (index + 1) * 800);
    });

    try {
      const response = await fetch(getApiUrl("/generate"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          satellite: cyclone.satellite,
          cyclone_id: cyclone.id,
          frame_a_time: selectedFrames[0],
          frame_b_time: selectedFrames[1],
          timestep: 0.5
        })
      });

      if (!response.ok) {
        throw new Error("Backend inference returned an error.");
      }

      const result = await response.json();
      
      // Clear pending timeouts immediately to bypass artificial delay
      timeouts.forEach(clearTimeout);
      
      setInterpolationResult(result);
      setGeneratedFrames(prev => ({
        ...prev,
        [result.timestamp]: result
      }));
      setIsInterpolated(true);
      setIsGenerating(false);
      
      // Auto-select the newly generated frame and display it
      setCurrentTime(result.timestamp);
    } catch (err) {
      console.error(err);
      timeouts.forEach(clearTimeout);
      setIsGenerating(false);
      alert("Inference Server connection failed. Ensure the FastAPI backend is running.");
    }
  };

  const handleReset = () => {
    if (cyclone && cyclone.frames && cyclone.frames.length >= 3) {
      const fA = cyclone.frames[0].timestamp;
      const fB = cyclone.frames[2].timestamp;
      setSelectedFrames([fA, fB]);
      const tA = timeStrToMinutes(fA);
      const tB = timeStrToMinutes(fB);
      const tMid = tA + (tB - tA) * 0.5;
      setCurrentTime(minutesToTimeStr(tMid));
    }
    setGeneratedFrames({});
    setIsInterpolated(false);
    setInterpolationResult(null);
  };

  const availableSatellites = Array.from(new Set(cyclones.map((c: any) => c.satellite)));

  // Generate Image paths for rendering
  const getFrameUrl = (timestamp: string, forceType?: "raw" | "interpolated" | "ai") => {
    if (!cyclone) return null;
    
    // Check if it is a generated intermediate frame (in-memory state or backend-loaded list)
    const isGenerated = generatedFrames[timestamp] || (cyclone.generated_frames && cyclone.generated_frames.includes(timestamp));
    
    let resolvedType = forceType || (isGenerated ? "interpolated" : "raw");
    if (resolvedType === "ai") {
      resolvedType = "interpolated";
    }
    
    if (resolvedType === "interpolated" && generatedFrames[timestamp]?.png_data) {
      return generatedFrames[timestamp].png_data;
    }
    
    return getApiUrl(`/frame?satellite=${cyclone.satellite}&cyclone_id=${cyclone.id}&timestamp=${timestamp}&type=${resolvedType}&format=png`);
  };

  // Generate NetCDF download paths
  const getFrameDownloadUrl = (timestamp: string, forceType?: "raw" | "interpolated" | "ai") => {
    if (!cyclone) return null;
    
    const isGenerated = generatedFrames[timestamp] || (cyclone.generated_frames && cyclone.generated_frames.includes(timestamp));
    
    let resolvedType = forceType || (isGenerated ? "interpolated" : "raw");
    if (resolvedType === "ai") {
      resolvedType = "interpolated";
    }
    
    return getApiUrl(`/frame?satellite=${cyclone.satellite}&cyclone_id=${cyclone.id}&timestamp=${timestamp}&type=${resolvedType}&format=nc`);
  };

  // Resolve the 3 displayed panel inputs based on active timeline currentTime
  const getWorkspacePanels = () => {
    const hasBoth = rawTimestamps.includes(currentTime) && (generatedFrames[currentTime] || (cyclone?.generated_frames && cyclone.generated_frames.includes(currentTime)));

    // 1. If we have exactly 2 selected frames (anchors), Left = Frame A, Right = Frame B
    if (selectedFrames.length === 2) {
      const frameA = selectedFrames[0];
      const frameB = selectedFrames[1];
      return {
        frameA,
        frameAUrl: getFrameUrl(frameA),
        frameADownload: getFrameDownloadUrl(frameA),
        frameB,
        frameBUrl: getFrameUrl(frameB),
        frameBDownload: getFrameDownloadUrl(frameB),
        middle: currentTime,
        middleUrl: getFrameUrl(currentTime, hasBoth ? centerViewMode : undefined),
        middleDownload: getFrameDownloadUrl(currentTime, hasBoth ? centerViewMode : undefined),
        middleType: generatedTimestamps.includes(currentTime) || (cyclone?.generated_frames && cyclone.generated_frames.includes(currentTime))
          ? "AI Synthesized Frame"
          : "Reference Observation",
        empty: false
      };
    }

    // 2. If we have exactly 1 selected frame, Left = Frame A, Right = Empty Placeholder
    if (selectedFrames.length === 1) {
      const frameA = selectedFrames[0];
      return {
        frameA,
        frameAUrl: getFrameUrl(frameA),
        frameADownload: getFrameDownloadUrl(frameA),
        frameB: "",
        frameBUrl: null,
        frameBDownload: null,
        middle: currentTime,
        middleUrl: getFrameUrl(currentTime, hasBoth ? centerViewMode : undefined),
        middleDownload: getFrameDownloadUrl(currentTime, hasBoth ? centerViewMode : undefined),
        middleType: generatedTimestamps.includes(currentTime) || (cyclone?.generated_frames && cyclone.generated_frames.includes(currentTime))
          ? "AI Synthesized Frame"
          : "Reference Observation",
        empty: false
      };
    }

    // 3. Fallback to neighbor-based logic if less than 1 frame is selected
    const isGenerated = generatedTimestamps.includes(currentTime);

    if (isGenerated) {
      const sortedAll = Array.from(new Set([...rawTimestamps, ...generatedTimestamps])).sort((a, b) => timeStrToMinutes(a) - timeStrToMinutes(b));
      const { parentA, parentB } = findParents(currentTime, sortedAll);
      return {
        frameA: parentA,
        frameAUrl: parentA ? getFrameUrl(parentA) : null,
        frameADownload: parentA ? getFrameDownloadUrl(parentA) : null,
        frameB: parentB,
        frameBUrl: parentB ? getFrameUrl(parentB) : null,
        frameBDownload: parentB ? getFrameDownloadUrl(parentB) : null,
        middle: currentTime,
        middleUrl: getFrameUrl(currentTime, hasBoth ? centerViewMode : undefined),
        middleDownload: getFrameDownloadUrl(currentTime, hasBoth ? centerViewMode : undefined),
        middleType: "AI Synthesized Frame",
        empty: false
      };
    }

    // If viewing a raw frame
    const currentIndex = rawTimestamps.indexOf(currentTime);
    const prevTimestamp = currentIndex > 0 ? rawTimestamps[currentIndex - 1] : null;
    const nextTimestamp = currentIndex < rawTimestamps.length - 1 ? rawTimestamps[currentIndex + 1] : null;

    return {
      frameA: prevTimestamp || "",
      frameAUrl: prevTimestamp ? getFrameUrl(prevTimestamp) : null,
      frameADownload: prevTimestamp ? getFrameDownloadUrl(prevTimestamp) : null,
      frameB: nextTimestamp || "",
      frameBUrl: nextTimestamp ? getFrameUrl(nextTimestamp) : null,
      frameBDownload: nextTimestamp ? getFrameDownloadUrl(nextTimestamp) : null,
      middle: currentTime,
      middleUrl: getFrameUrl(currentTime, hasBoth ? centerViewMode : undefined),
      middleDownload: getFrameDownloadUrl(currentTime, hasBoth ? centerViewMode : undefined),
      middleType: "Reference Observation",
      empty: false
    };
  };

  const panels = getWorkspacePanels();

  const hasBoth = rawTimestamps.includes(currentTime) && (generatedFrames[currentTime] || (cyclone?.generated_frames && cyclone.generated_frames.includes(currentTime)));

  // Helper zoom trigger
  const triggerZoom = (url: string | null, title: string) => {
    if (!url) return;
    setZoomedImage(url);
    setZoomedTitle(title);
  };

  return (
    <div className="min-h-screen bg-space-navy-950 text-slate-100 flex flex-col font-sans select-none pb-8">
      
      {/* 1. COMPACT STATUS HEADER */}
      <header className="bg-space-navy-900 border-b border-space-navy-800 px-6 py-3 flex flex-wrap items-center justify-between gap-4 z-10 select-none">
        <div className="flex items-center space-x-3">
          <div className="bg-cyan-accent/15 border border-cyan-accent/30 p-1.5 rounded">
            <Cpu className="h-5 w-5 text-cyan-accent" />
          </div>
          <div>
            <h1 className="font-heading text-sm font-bold uppercase tracking-wider text-white">
              ISRO Cyclone Interpolator
            </h1>
            <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
              Meteorological Temporal Enhancement Console
            </p>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex bg-space-navy-950 border border-space-navy-850 p-0.5 rounded text-[10px] font-mono select-none">
          <button
            onClick={() => !isGenerating && setViewMode("database")}
            disabled={isGenerating}
            className={`px-3 py-1 rounded font-bold transition-all flex items-center space-x-1.5 ${
              viewMode === "database"
                ? "bg-cyan-accent text-space-navy-950 shadow-[0_0_8px_rgba(0,245,212,0.4)]"
                : "text-slate-400 hover:text-white"
            } disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer`}
          >
            <Database className="h-3.5 w-3.5" />
            <span>Database Explorer</span>
          </button>
          <button
            onClick={() => !isGenerating && setViewMode("upload")}
            disabled={isGenerating}
            className={`px-3 py-1 rounded font-bold transition-all flex items-center space-x-1.5 ${
              viewMode === "upload"
                ? "bg-cyan-accent text-space-navy-950 shadow-[0_0_8px_rgba(0,245,212,0.4)]"
                : "text-slate-400 hover:text-white"
            } disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer`}
          >
            <Upload className="h-3.5 w-3.5" />
            <span>Custom Upload Workspace</span>
          </button>
        </div>

        {/* Dynamic Controls & Badges */}
        <div className="flex items-center space-x-4">
          
          {/* Satellite Dropdown */}
          <div className="flex items-center space-x-1.5">
            <span className="text-[10px] font-mono text-slate-500 uppercase">SAT:</span>
            <select
              value={dataset}
              onChange={(e) => {
                setDataset(e.target.value);
                const newSatCyclones = cyclones.filter(c => c.satellite.toUpperCase() === e.target.value.toUpperCase());
                if (newSatCyclones.length > 0) {
                  setCyclone(newSatCyclones[0]);
                }
              }}
              disabled={isGenerating}
              className="bg-space-navy-950 border border-space-navy-800 text-xs font-mono text-slate-300 px-2 py-1 rounded focus:outline-none focus:border-cyan-accent disabled:opacity-50"
            >
              {availableSatellites.map((sat: any) => (
                <option key={sat} value={sat}>{sat}</option>
              ))}
            </select>
          </div>

          {/* Cyclone Dropdown */}
          <div className="flex items-center space-x-1.5">
            <span className="text-[10px] font-mono text-slate-500 uppercase">CYCLONE:</span>
            <select
              value={cyclone?.id || ""}
              onChange={(e) => {
                const selected = cyclones.find((c) => c.id === e.target.value);
                if (selected) setCyclone(selected);
              }}
              disabled={isGenerating}
              className="bg-space-navy-950 border border-space-navy-800 text-xs font-mono text-slate-300 px-2 py-1 rounded focus:outline-none focus:border-cyan-accent disabled:opacity-50"
            >
              {filteredCyclones.map((c: any) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Generated Frames Counter */}
          <div className="bg-space-navy-950 border border-space-navy-850 px-2.5 py-1 rounded text-xs font-mono flex items-center space-x-1.5">
            <span className="text-[10px] text-slate-500 uppercase font-bold">Synthesized:</span>
            <span className="text-cyan-accent font-bold">{generatedTimestamps.length}</span>
          </div>

          {/* Temporal Resolution Badge (Animated only after successful generation) */}
          <div className="bg-space-navy-950 border border-space-navy-850 px-2.5 py-1 rounded text-xs font-mono flex items-center space-x-1.5">
            <span className="text-[10px] text-slate-500 uppercase font-bold">Temporal Res:</span>
            <motion.span
              key={temporalResolution}
              initial={{ scale: 1 }}
              animate={isInterpolated ? { scale: [1, 1.3, 1], color: ["#fff", "#00f5d4", "#fff"] } : {}}
              transition={{ duration: 0.6 }}
              className="text-white font-bold"
            >
              {temporalResolution}
            </motion.span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            <Button
              variant="primary"
              onClick={handleInterpolate}
              disabled={isGenerating || selectedFrames.length !== 2}
              className="h-8 text-xs font-mono font-bold"
              icon={Sparkles}
            >
              Interpolate
            </Button>
            <Button
              variant="secondary"
              onClick={handleReset}
              disabled={isGenerating}
              className="h-8 text-xs font-mono"
              icon={RotateCcw}
            >
              Reset
            </Button>
          </div>

        </div>
      </header>

      {viewMode === "database" ? (
        <>
          {/* 2. ML PIPELINE STRIP */}
      <section className="bg-space-navy-950 px-6 py-2.5 border-b border-space-navy-900 select-none">
        <div className="max-w-6xl mx-auto flex items-center justify-between bg-space-navy-900/60 border border-space-navy-850 p-2 px-4 rounded-md text-[10px] font-mono text-slate-400">
          
          <div className="flex items-center space-x-1.5">
            <Database className="h-3.5 w-3.5 text-slate-500" />
            <span className="font-bold text-slate-300">ML INFERENCE PIPELINE:</span>
          </div>

          {/* Pipeline stages */}
          <div className="flex items-center space-x-2 md:space-x-4">
            
            <div className={`flex items-center px-2 py-0.5 rounded border transition-colors ${
              isGenerating && generationStep === 0 
                ? "bg-cyan-accent/10 border-cyan-accent text-cyan-accent font-bold" 
                : "bg-space-navy-950 border-space-navy-800 text-slate-400"
            }`}>
              <span>1. NetCDF Ingestion</span>
            </div>

            <ArrowRight className="h-3 w-3 text-slate-600" />

            <div className={`flex items-center px-2 py-0.5 rounded border transition-colors ${
              isGenerating && generationStep === 1 
                ? "bg-cyan-accent/10 border-cyan-accent text-cyan-accent font-bold" 
                : "bg-space-navy-950 border-space-navy-800 text-slate-400"
            }`}>
              <span>2. Normalization</span>
            </div>

            <ArrowRight className="h-3 w-3 text-slate-600" />

            <div className={`flex items-center px-2 py-0.5 rounded border transition-colors ${
              isGenerating && generationStep === 2 
                ? "bg-cyan-accent/10 border-cyan-accent text-cyan-accent font-bold" 
                : "bg-space-navy-950 border-space-navy-800 text-slate-400"
            }`}>
              <span>3. Optical Flow</span>
            </div>

            <ArrowRight className="h-3 w-3 text-slate-600" />

            <div className={`flex items-center px-2 py-0.5 rounded border transition-colors ${
              isGenerating && generationStep === 3 
                ? "bg-cyan-accent/10 border-cyan-accent text-cyan-accent font-bold" 
                : "bg-space-navy-950 border-space-navy-800 text-slate-400"
            }`}>
              <span>4. Frame Synthesis</span>
            </div>

            <ArrowRight className="h-3 w-3 text-slate-600" />

            <div className={`flex items-center px-2 py-0.5 rounded border transition-colors ${
              isGenerating && generationStep === 4 
                ? "bg-cyan-accent/10 border-cyan-accent text-cyan-accent font-bold" 
                : "bg-space-navy-950 border-space-navy-800 text-slate-400"
            }`}>
              <span>5. NetCDF Compilation</span>
            </div>

            <ArrowRight className="h-3 w-3 text-slate-600" />

            <div className={`flex items-center px-2 py-0.5 rounded border transition-colors ${
              !isGenerating 
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" 
                : "bg-space-navy-950 border-space-navy-800 text-slate-400"
            }`}>
              <span>6. Visualization</span>
            </div>

          </div>

          <div className="text-[9px] text-slate-500 uppercase">
            {isGenerating ? "Inference Active" : "Standby"}
          </div>

        </div>
      </section>

      {/* 3. MAIN WORKSPACE */}
      <SectionContainer className="py-4 grow flex flex-col justify-start max-w-7xl mx-auto w-full space-y-4">
        
        {/* Workspace Toolbar */}
        <ImageToolbar
          playbackMode={playbackMode}
          setPlaybackMode={setPlaybackMode}
          cycloneId={cyclone?.id}
          satellite={cyclone?.satellite || dataset}
          hasInterp={isInterpolated || !!(cyclone?.generated_frames && cyclone.generated_frames.length > 0)}
        />

        {/* Dynamic Workspace Switcher (Triad vs Scientific Compare) */}
        {playbackMode === "compare" ? (
          (() => {
            const [pA, pB] = getSurroundingAnchors(currentTime);
            const depth = getInterpolationDepth(currentTime);
            const tempRes = getFrameTemporalResolution(currentTime);
            
            // Resolve metrics & inference stats from state or index
            const frameMetrics = generatedFrames[currentTime]?.metrics || cyclone?.generated_metadata?.[currentTime]?.scientific_metrics || null;
            const infTime = generatedFrames[currentTime]?.inference_time_ms !== undefined 
              ? generatedFrames[currentTime].inference_time_ms 
              : cyclone?.generated_metadata?.[currentTime]?.inference_time !== undefined 
                ? cyclone.generated_metadata[currentTime].inference_time 
                : null;
                
            return (
              <ScientificComparisonWorkspace
                satellite={cyclone?.satellite || dataset}
                cycloneId={cyclone?.id || ""}
                timestamp={currentTime}
                hasGroundTruth={!!cyclone?.ground_truth_availability?.[currentTime]}
                metrics={frameMetrics}
                inferenceTimeMs={infTime}
                imageUrl={generatedFrames[currentTime]?.png_data || getApiUrl(`/frame?satellite=${cyclone?.satellite}&cyclone_id=${cyclone?.id}&timestamp=${currentTime}&type=interpolated&format=png`)}
                gtImageUrl={getApiUrl(`/frame?satellite=${cyclone?.satellite}&cyclone_id=${cyclone?.id}&timestamp=${currentTime}&type=raw&format=png`)}
                diffImageUrl={generatedFrames[currentTime]?.difference_png_data || getApiUrl(`/frame?satellite=${cyclone?.satellite}&cyclone_id=${cyclone?.id}&timestamp=${currentTime}&type=difference&format=png`)}
                downloadNcUrl={getApiUrl(`/frame?satellite=${cyclone?.satellite}&cyclone_id=${cyclone?.id}&timestamp=${currentTime}&type=interpolated&format=nc`)}
                downloadGtNcUrl={cyclone?.ground_truth_availability?.[currentTime] ? getApiUrl(`/frame?satellite=${cyclone?.satellite}&cyclone_id=${cyclone?.id}&timestamp=${currentTime}&type=raw&format=nc`) : null}
                downloadDiffNcUrl={getApiUrl(`/frame?satellite=${cyclone?.satellite}&cyclone_id=${cyclone?.id}&timestamp=${currentTime}&type=difference&format=nc`)}
                isDifferenceMapPlaceholder={!cyclone?.ground_truth_availability?.[currentTime]}
                parentA={pA}
                parentB={pB}
                interpolationDepth={depth}
                temporalResolution={tempRes}
                modelVersion="best_model_512.pth"
                rawTimestamps={rawTimestamps}
                generatedTimestamps={Object.keys(generatedFrames).concat(cyclone?.generated_frames || [])}
                currentTime={currentTime}
                setCurrentTime={setCurrentTime}
                cyclone={cyclone}
              />
            );
          })()
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Left Panel */}
            <ImagePanel
              title={panels.frameA ? "Input Frame A" : "Preceding Observation"}
              timestamp={panels.frameA}
              image={panels.frameAUrl}
              frameType="Reference Observation"
              onZoom={() => triggerZoom(panels.frameAUrl, `Input Frame A (${panels.frameA} UTC)`)}
              downloadUrl={panels.frameADownload}
            />

            {/* Center Panel (Success / Loading / Empty State) */}
            {isGenerating ? (
              <div className="w-full aspect-square md:aspect-[4/3] min-h-[300px]">
                <LoadingSequence />
              </div>
            ) : (
              <ImagePanel
                title={generatedFrames[currentTime] || (cyclone?.generated_frames && cyclone.generated_frames.includes(currentTime)) ? "AI Generated Midpoint" : "Workspace Frame"}
                timestamp={currentTime}
                image={panels.middleUrl}
                frameType={panels.middleType}
                emptyState={!rawTimestamps.includes(currentTime) && !generatedFrames[currentTime] && !(cyclone?.generated_frames && cyclone.generated_frames.includes(currentTime))}
                emptyContext={{
                  frameA: selectedFrames[0],
                  frameB: selectedFrames[1]
                }}
                activeSource={hasBoth ? centerViewMode : undefined}
                onSourceChange={hasBoth ? setCenterViewMode : undefined}
                onZoom={() => triggerZoom(panels.middleUrl, `Workspace Frame (${currentTime} UTC)`)}
                downloadUrl={panels.middleDownload}
              />
            )}

            {/* Right Panel */}
            <ImagePanel
              title={panels.frameB ? "Input Frame B" : "Succeeding Observation"}
              timestamp={panels.frameB}
              image={panels.frameBUrl}
              frameType="Reference Observation"
              onZoom={() => triggerZoom(panels.frameBUrl, `Input Frame B (${panels.frameB} UTC)`)}
              downloadUrl={panels.frameBDownload}
            />
          </div>
        )}

        {/* 4. COMPACT GENERATION SUMMARY CARD (Visible after interpolation completes) */}
        {playbackMode === "triad" && isInterpolated && interpolationResult && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-space-navy-900 border border-emerald-500/20 bg-gradient-to-r from-space-navy-900 to-emerald-950/10 p-4 rounded-lg flex flex-wrap items-center justify-between gap-4 select-none"
          >
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center">
                <CheckCircle className="h-4.5 w-4.5 text-emerald-400" />
              </div>
              <div>
                <h4 className="font-heading text-xs font-bold text-white uppercase tracking-wide">
                  ✓ Intermediate Frame Generated Successfully
                </h4>
                <p className="text-[10px] font-mono text-slate-500">
                  Target Timestamp: {interpolationResult.timestamp} UTC | Registered to Active Workspace Timeline
                </p>
              </div>
            </div>

            {/* Summary Metrics */}
            <div className="flex items-center space-x-6 text-xs font-mono">
              <div className="flex flex-col">
                <span className="text-[8px] text-slate-500 uppercase font-black">Enhancement</span>
                <span className="text-slate-300 font-bold">{getEnhancementLabel()}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[8px] text-slate-500 uppercase font-black">Inference Time</span>
                <span className="text-cyan-accent font-black flex items-center space-x-1">
                  <Clock className="h-3 w-3 inline" />
                  <span>{interpolationResult.inference_time_ms === 0 ? "Cached" : `${interpolationResult.inference_time_ms.toFixed(1)} ms`}</span>
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-[8px] text-slate-500 uppercase font-black">Ground Truth</span>
                <span className="text-slate-300 font-bold">
                  {interpolationResult.is_difference_map_placeholder ? "Virtual (No Observation)" : "Reference Verified"}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-[8px] text-slate-500 uppercase font-black">SSIM Accuracy</span>
                <span className="text-white font-bold">{interpolationResult.metrics.ssim.toFixed(4)}</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* 5. INTERACTIVE TIMELINE SECTION */}
        <Timeline
          rawTimestamps={rawTimestamps}
          generatedTimestamps={generatedTimestamps}
          selectedFrames={selectedFrames}
          setSelectedFrames={setSelectedFrames}
          currentTime={currentTime}
          setCurrentTime={setCurrentTime}
          isGenerating={isGenerating}
          cyclone={cyclone}
          playbackMode={playbackMode}
        />

        </SectionContainer>
      </>
    ) : (
      <SectionContainer className="py-6 grow flex flex-col justify-start max-w-7xl mx-auto w-full">
        <UploadWorkspace />
      </SectionContainer>
    )}

      {/* FULL-SCREEN ZOOM LIGHTBOX MODAL */}
      <Lightbox
        isOpen={zoomedImage !== null}
        image={zoomedImage}
        title={zoomedTitle}
        onClose={() => setZoomedImage(null)}
      />

    </div>
  );
}
