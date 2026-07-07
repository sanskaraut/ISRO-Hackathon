"use client";

import React, { useState, useRef, useEffect } from "react";
import { 
  Info, HelpCircle, Download, ToggleRight, Sliders, Image, Activity, 
  AlertTriangle, GitCommit, Clock, Play, Pause, SkipForward, SkipBack,
  Layers, CheckCircle2, ChevronRight, BarChart3, ShieldAlert, Award, Zap
} from "lucide-react";
import { getApiUrl } from "@/utils/api";

// ─── Model training constants (from checkpoint epoch 9) ──────────────────────
const MODEL_BEST_VAL_SSIM  = 0.9319521307945251;
const MODEL_BEST_VAL_EPOCH = 9;

interface ScientificComparisonWorkspaceProps {
  satellite: string;
  cycloneId: string;
  timestamp: string;
  hasGroundTruth: boolean;
  metrics: {
    ssim: number;
    psnr: number;
    mse: number;
    fsim: number;
  } | null;
  inferenceTimeMs: number | null;
  imageUrl: string;
  gtImageUrl: string;
  diffImageUrl: string;
  downloadNcUrl: string | null;
  downloadGtNcUrl: string | null;
  downloadDiffNcUrl: string | null;
  isDifferenceMapPlaceholder: boolean;
  parentA: string | null;
  parentB: string | null;
  interpolationDepth: number;
  temporalResolution: string;
  modelVersion: string;
  
  // New playback and timeline sync props
  rawTimestamps: string[];
  generatedTimestamps: string[];
  currentTime: string;
  setCurrentTime: (time: string) => void;
  cyclone: any;
}

// ─── Metric bar helper ────────────────────────────────────────────────────────
function MetricBar({ value, max = 1, invert = false }: { value: number; max?: number; invert?: boolean }) {
  const pct = Math.min(1, Math.max(0, invert ? 1 - value / max : value / max));
  const color = pct > 0.85 ? "#00f5d4" : pct > 0.6 ? "#3a86ff" : "#f59e0b";
  return (
    <div className="h-1 w-full bg-space-navy-800 rounded-full overflow-hidden mt-1.5">
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{ width: `${pct * 100}%`, backgroundColor: color }}
      />
    </div>
  );
}

export default function ScientificComparisonWorkspace({
  satellite,
  cycloneId,
  timestamp,
  hasGroundTruth,
  metrics,
  inferenceTimeMs,
  imageUrl,
  gtImageUrl,
  diffImageUrl,
  downloadNcUrl,
  downloadGtNcUrl,
  downloadDiffNcUrl,
  isDifferenceMapPlaceholder,
  parentA,
  parentB,
  interpolationDepth,
  temporalResolution,
  modelVersion,
  
  rawTimestamps,
  generatedTimestamps,
  currentTime,
  setCurrentTime,
  cyclone
}: ScientificComparisonWorkspaceProps) {
  // Mode selection: "single" (Single Frame Analysis) or "playback" (Animation Playback)
  const [workspaceMode, setWorkspaceMode] = useState<"single" | "playback">("single");
  
  // Single Frame Analysis submodes
  const [activeTab, setActiveTab] = useState<"slider" | "gt" | "ai" | "heatmap">("slider");
  const [sliderPos, setSliderPos] = useState<number>(50);
  const sliderContainerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef<boolean>(false);

  // Playback Animation States
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<0.5 | 1 | 2>(1);
  const [playbackSequence, setPlaybackSequence] = useState<"raw" | "all">("all");

  const isFrameGenerated = React.useMemo(() => {
    return generatedTimestamps.includes(timestamp) || !!(cyclone?.generated_frames && cyclone.generated_frames.includes(timestamp));
  }, [timestamp, generatedTimestamps, cyclone]);

  const isPendingGeneration = React.useMemo(() => {
    return !rawTimestamps.includes(timestamp) && !isFrameGenerated;
  }, [timestamp, rawTimestamps, isFrameGenerated]);

  const resolvedImageUrl = React.useMemo(() => {
    return (rawTimestamps.includes(timestamp) && !isFrameGenerated) ? gtImageUrl : imageUrl;
  }, [timestamp, rawTimestamps, isFrameGenerated, gtImageUrl, imageUrl]);

  const resolvedAiLabel = React.useMemo(() => {
    return (rawTimestamps.includes(timestamp) && !isFrameGenerated) ? "[ Original Observation ]" : "[ AI Generated ]";
  }, [timestamp, rawTimestamps, isFrameGenerated]);

  const resolvedAiTabLabel = React.useMemo(() => {
    return (rawTimestamps.includes(timestamp) && !isFrameGenerated) ? "[ Original Observation (Raw) ]" : "[ AI Generated Frame ]";
  }, [timestamp, rawTimestamps, isFrameGenerated]);

  // Chronologically sorted list of all unique timestamps
  const sortedTimeline = React.useMemo(() => {
    const timeStrToMinutes = (tStr: string) => {
      const parts = tStr.split(":");
      return parts.length === 2 
        ? parseInt(parts[0]) * 60 + parseInt(parts[1])
        : parseInt(parts[0]) * 60 + parseInt(parts[1]) + parseInt(parts[2]) / 60;
    };
    return Array.from(new Set([...rawTimestamps, ...generatedTimestamps]))
      .sort((a, b) => timeStrToMinutes(a) - timeStrToMinutes(b));
  }, [rawTimestamps, generatedTimestamps]);

  // The active timeline array used for playback navigation and loop
  const activeTimeline = React.useMemo(() => {
    if (playbackSequence === "raw") {
      const timeStrToMinutes = (tStr: string) => {
        const parts = tStr.split(":");
        return parts.length === 2 
          ? parseInt(parts[0]) * 60 + parseInt(parts[1])
          : parseInt(parts[0]) * 60 + parseInt(parts[1]) + parseInt(parts[2]) / 60;
      };
      return [...rawTimestamps].sort((a, b) => timeStrToMinutes(a) - timeStrToMinutes(b));
    }
    return sortedTimeline;
  }, [playbackSequence, rawTimestamps, sortedTimeline]);

  // Sync submode if ground truth vanishes
  useEffect(() => {
    if (!hasGroundTruth) {
      if (activeTab === "slider" || activeTab === "gt") {
        setActiveTab("ai");
      }
    } else if (activeTab === "ai") {
      setActiveTab("slider");
    }
  }, [hasGroundTruth, timestamp]);

  // Drag listeners for slider comparison
  const handleSliderMove = (clientX: number) => {
    if (!sliderContainerRef.current) return;
    const rect = sliderContainerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPos(percentage);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;
    handleSliderMove(e.clientX);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    isDragging.current = true;
    if (e.touches[0]) {
      handleSliderMove(e.touches[0].clientX);
    }
  };

  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isDragging.current) handleSliderMove(e.clientX);
    };
    const handleGlobalMouseUp = () => {
      isDragging.current = false;
    };
    window.addEventListener("mousemove", handleGlobalMouseMove);
    window.addEventListener("mouseup", handleGlobalMouseUp);
    window.addEventListener("touchend", handleGlobalMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleGlobalMouseMove);
      window.removeEventListener("mouseup", handleGlobalMouseUp);
      window.removeEventListener("touchend", handleGlobalMouseUp);
    };
  }, []);

  // Maintain a reference to current time to avoid stale closures
  const currentTimeRef = useRef(currentTime);
  useEffect(() => {
    currentTimeRef.current = currentTime;
  }, [currentTime]);

  // Animation Playback Loop Effect
  useEffect(() => {
    if (!isPlaying) return;
    const delay = 1000 / playbackSpeed;
    const intervalId = setInterval(() => {
      const latestTime = currentTimeRef.current;
      const currIndex = activeTimeline.indexOf(latestTime);
      if (currIndex === -1 || currIndex === activeTimeline.length - 1) {
        setCurrentTime(activeTimeline[0]);
      } else {
        setCurrentTime(activeTimeline[currIndex + 1]);
      }
    }, delay);
    return () => clearInterval(intervalId);
  }, [isPlaying, playbackSpeed, activeTimeline, setCurrentTime]);

  const handlePrevFrame = () => {
    const currIndex = activeTimeline.indexOf(currentTime);
    if (currIndex > 0) {
      setCurrentTime(activeTimeline[currIndex - 1]);
    } else {
      setCurrentTime(activeTimeline[activeTimeline.length - 1]);
    }
  };

  const handleNextFrame = () => {
    const currIndex = activeTimeline.indexOf(currentTime);
    if (currIndex !== -1 && currIndex < activeTimeline.length - 1) {
      setCurrentTime(activeTimeline[currIndex + 1]);
    } else {
      setCurrentTime(activeTimeline[0]);
    }
  };

  // Convert HH:MM to absolute minutes
  const timeStrToMinutes = (tStr: string) => {
    const parts = tStr.split(":");
    return parts.length === 2 
      ? parseInt(parts[0]) * 60 + parseInt(parts[1])
      : parseInt(parts[0]) * 60 + parseInt(parts[1]) + parseInt(parts[2]) / 60;
  };

  // Helper to resolve the Left Panel (Original) observation image URL
  const getOriginalTelemetryUrl = () => {
    const targetMins = timeStrToMinutes(currentTime);
    let bestRaw = rawTimestamps[0];
    let maxRawMins = -1;
    for (const raw of rawTimestamps) {
      const rawMins = timeStrToMinutes(raw);
      if (rawMins <= targetMins && rawMins > maxRawMins) {
        maxRawMins = rawMins;
        bestRaw = raw;
      }
    }
    return getApiUrl(`/frame?satellite=${satellite}&cyclone_id=${cycloneId}&timestamp=${bestRaw}&type=raw&format=png`);
  };

  // Helper to extract active original timestamp
  const getOriginalTelemetryTimestamp = () => {
    const targetMins = timeStrToMinutes(currentTime);
    let bestRaw = rawTimestamps[0];
    let maxRawMins = -1;
    for (const raw of rawTimestamps) {
      const rawMins = timeStrToMinutes(raw);
      if (rawMins <= targetMins && rawMins > maxRawMins) {
        maxRawMins = rawMins;
        bestRaw = raw;
      }
    }
    return bestRaw;
  };

  // Validation metrics definition configurations
  const metricConfigs = {
    ssim: {
      name: "SSIM",
      fullName: "Structural Similarity Index Measure",
      desc: "Compares structural patterns, local luminance, and contrast boundaries. Evaluates shape coherence of weather structures (like the storm eye).",
      range: "[-1.0, 1.0] (1.0000 indicates absolute structural replication)",
      matters: "Severe tropical cyclones require highly accurate cloud edge alignments. Lower SSIM indicates structural deformation or blurring."
    },
    psnr: {
      name: "PSNR",
      fullName: "Peak Signal-to-Noise Ratio",
      desc: "Calculates the ratio between maximum signal strength and corrupting noise in decibels (dB). Measures overall pixel reconstruction sharpness.",
      range: "[0, inf) (Typical high-quality target ranges: 30.0 dB to 45.0 dB)",
      matters: "A higher decibel value guarantees lower compression artifacts and sharper details in synthesized cloud boundaries."
    },
    mse: {
      name: "MSE",
      fullName: "Mean Squared Error",
      desc: "Computes the average squared discrepancy between simulated pixel brightness temperatures and ground truth references.",
      range: "[0, inf) (0 indicates a perfect pixel match)",
      matters: "Serves as the optimization target loss. Represents average spatial deviations in pixel values across the 512x512 tile."
    },
    fsim: {
      name: "FSIM",
      fullName: "Feature Similarity Index Measure",
      desc: "Assesses quality using low-level features (phase congruency and gradient magnitude). Closely mirrors human visual perception.",
      range: "[0.0, 1.0] (Closer to 1.0000 indicates pristine feature agreement)",
      matters: "Detects micro-texture patterns in storm structures and bands that standard SSIM might miss."
    }
  };

  // Validation Summary Statistics calculations
  const statsSummary = React.useMemo(() => {
    const metadataMap = cyclone?.generated_metadata || {};
    const totalGenerated = Object.keys(metadataMap).length;
    
    // Filter generated frames that contain reference ground truth validation metrics
    const validatedItems = Object.values(metadataMap).filter(
      (item: any) => item.ground_truth_availability === true && item.scientific_metrics
    );
    const totalValidated = validatedItems.length;

    if (totalValidated < 3) {
      return {
        totalGenerated,
        totalValidated,
        eligible: false
      };
    }

    const avgSsim = validatedItems.reduce((acc: number, item: any) => acc + item.scientific_metrics.ssim, 0) / totalValidated;
    const avgPsnr = validatedItems.reduce((acc: number, item: any) => acc + item.scientific_metrics.psnr, 0) / totalValidated;
    const avgMse = validatedItems.reduce((acc: number, item: any) => acc + item.scientific_metrics.mse, 0) / totalValidated;
    const avgFsim = validatedItems.reduce((acc: number, item: any) => acc + item.scientific_metrics.fsim, 0) / totalValidated;
    const avgInf = validatedItems.reduce((acc: number, item: any) => acc + (item.inference_time || 0), 0) / totalValidated;

    return {
      totalGenerated,
      totalValidated,
      avgSsim,
      avgPsnr,
      avgMse,
      avgFsim,
      avgInf,
      eligible: true
    };
  }, [cyclone]);

  // Extract model version safely
  const resolvedModelVersion = React.useMemo(() => {
    if (cyclone?.generated_metadata && currentTime && cyclone.generated_metadata[currentTime]) {
      return cyclone.generated_metadata[currentTime].model_version || "Unknown";
    }
    return modelVersion || "Unknown";
  }, [cyclone, currentTime, modelVersion]);

  return (
    <div className="space-y-4">
      
      {/* 1. TOP CONTROL & SWITCHER HEADER */}
      <section className="bg-space-navy-900 border border-space-navy-800 p-3 rounded-xl flex items-center justify-between gap-4 select-none shadow-lg">
        <div className="flex items-center space-x-2.5">
          <div className="h-7 w-7 rounded-lg bg-cyan-accent/10 border border-cyan-accent/30 flex items-center justify-center">
            <BarChart3 className="h-4 w-4 text-cyan-accent" />
          </div>
          <div>
            <h2 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
              Scientific Analysis Workspace
            </h2>
            <p className="text-[9px] font-mono text-slate-500 tracking-widest">ISRO PS-12 Evaluation Mode</p>
          </div>
        </div>
        
        {/* Toggle between Single Frame vs Animation playback */}
        <div className="flex bg-space-navy-950 p-0.5 rounded-lg border border-space-navy-800 text-[10px] font-mono">
          <button
            onClick={() => { setWorkspaceMode("single"); setIsPlaying(false); }}
            className={`px-3.5 py-1.5 rounded-md font-bold transition-all cursor-pointer ${
              workspaceMode === "single"
                ? "bg-cyan-accent text-space-navy-950 shadow-[0_0_8px_rgba(0,245,212,0.4)]"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Single Frame Analysis
          </button>
          <button
            onClick={() => setWorkspaceMode("playback")}
            className={`px-3.5 py-1.5 rounded-md font-bold transition-all cursor-pointer ${
              workspaceMode === "playback"
                ? "bg-cyan-accent text-space-navy-950 shadow-[0_0_8px_rgba(0,245,212,0.4)]"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Animation Playback
          </button>
        </div>
      </section>

      {/* 2. DYNAMIC WORKSPACE BODY */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        
        {/* LEFT COLUMN: VISUALIZATIONS */}
        <div className="lg:col-span-8 flex flex-col space-y-4">
          
          {workspaceMode === "single" ? (
            /* ========================================================
               SINGLE FRAME ANALYSIS VIEW
               ======================================================== */
            <div className="flex flex-col space-y-4">
              
              {/* Tab Selector Buttons */}
              {isFrameGenerated && (
                <div className="flex items-center justify-between bg-space-navy-900 border border-space-navy-800 p-1.5 rounded-xl select-none shadow-md">
                  <div className="flex bg-space-navy-950 p-0.5 rounded-lg border border-space-navy-800 text-[10px] font-mono">
                    {hasGroundTruth ? (
                      <button
                        onClick={() => setActiveTab("slider")}
                        className={`px-3.5 py-1.5 rounded-md font-bold transition-all flex items-center space-x-1 cursor-pointer ${
                          activeTab === "slider"
                            ? "bg-cyan-accent text-space-navy-950 shadow-[0_0_8px_rgba(0,245,212,0.4)] font-black"
                            : "text-slate-400 hover:text-white"
                        }`}
                      >
                        <Sliders className="h-3 w-3" />
                        <span>Slider Compare</span>
                      </button>
                    ) : null}

                    {hasGroundTruth ? (
                      <button
                        onClick={() => setActiveTab("gt")}
                        className={`px-3.5 py-1.5 rounded-md font-bold transition-all flex items-center space-x-1 cursor-pointer ${
                          activeTab === "gt"
                            ? "bg-cyan-accent text-space-navy-950 shadow-[0_0_8px_rgba(0,245,212,0.4)] font-black"
                            : "text-slate-400 hover:text-white"
                        }`}
                      >
                        <Image className="h-3 w-3" />
                        <span>Ground Truth</span>
                      </button>
                    ) : null}

                    <button
                      onClick={() => setActiveTab("ai")}
                      className={`px-3.5 py-1.5 rounded-md font-bold transition-all flex items-center space-x-1 cursor-pointer ${
                        activeTab === "ai"
                          ? "bg-cyan-accent text-space-navy-950 shadow-[0_0_8px_rgba(0,245,212,0.4)] font-black"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      <Activity className="h-3 w-3" />
                      <span>AI Generated</span>
                    </button>

                    <button
                      onClick={() => setActiveTab("heatmap")}
                      className={`px-3.5 py-1.5 rounded-md font-bold transition-all flex items-center space-x-1 cursor-pointer ${
                        activeTab === "heatmap"
                          ? "bg-cyan-accent text-space-navy-950 shadow-[0_0_8px_rgba(0,245,212,0.4)] font-black"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      <ToggleRight className="h-3 w-3" />
                      <span>Difference Map</span>
                    </button>
                  </div>

                  {/* NetCDF Download Buttons */}
                  <div className="flex items-center space-x-2">
                    {activeTab === "gt" && downloadGtNcUrl && (
                      <a
                        href={downloadGtNcUrl}
                        download
                        className="bg-space-navy-950 hover:bg-space-navy-900 border border-space-navy-800 hover:border-slate-600 text-slate-300 hover:text-white px-2.5 py-1.5 rounded-lg text-[10px] font-mono font-bold flex items-center space-x-1 transition-all cursor-pointer"
                      >
                        <Download className="h-3 w-3" />
                        <span>Download GT</span>
                      </a>
                    )}
                    {(activeTab === "ai" || activeTab === "slider") && downloadNcUrl && (
                      <a
                        href={downloadNcUrl}
                        download
                        className="bg-space-navy-950 hover:bg-space-navy-900 border border-space-navy-800 hover:border-slate-600 text-slate-300 hover:text-white px-2.5 py-1.5 rounded-lg text-[10px] font-mono font-bold flex items-center space-x-1 transition-all cursor-pointer"
                      >
                        <Download className="h-3 w-3" />
                        <span>Download AI .nc</span>
                      </a>
                    )}
                    {activeTab === "heatmap" && !isDifferenceMapPlaceholder && downloadDiffNcUrl && (
                      <a
                        href={downloadDiffNcUrl}
                        download
                        className="bg-space-navy-950 hover:bg-space-navy-900 border border-space-navy-800 hover:border-slate-600 text-slate-300 hover:text-white px-2.5 py-1.5 rounded-lg text-[10px] font-mono font-bold flex items-center space-x-1 transition-all cursor-pointer"
                      >
                        <Download className="h-3 w-3" />
                        <span>Download Diff</span>
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* View Panel Display Box */}
              <div className="bg-space-navy-950 border border-space-navy-800 rounded-xl aspect-square md:aspect-[4/3] w-full relative overflow-hidden flex items-center justify-center select-none shadow-2xl ring-1 ring-black/20">
                
                {!isFrameGenerated ? (
                  rawTimestamps.includes(timestamp) ? (
                    <>
                      <img 
                        src={gtImageUrl} 
                        alt="Ground Truth" 
                        className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                        draggable={false}
                      />
                      <div className="absolute top-3 left-3 bg-space-navy-950/90 border border-space-navy-800 px-2.5 py-1 rounded-lg text-[8px] font-mono font-black text-white uppercase tracking-widest backdrop-blur-sm">
                        [ Original Observation (Raw) ]
                      </div>
                      <div className="absolute bottom-3 left-3 right-3 bg-space-navy-950/90 border border-cyan-accent/30 p-2.5 rounded-lg text-[9px] font-mono text-cyan-accent flex items-center space-x-2 backdrop-blur-sm shadow-[0_0_10px_rgba(0,245,212,0.1)]">
                        <Info className="h-4 w-4 text-cyan-accent shrink-0" />
                        <span>AI interpolation has not been executed for this timestamp. Telemetry reference is displayed.</span>
                      </div>
                    </>
                  ) : (
                    <div className="text-center p-6 max-w-sm space-y-3 font-mono select-none">
                      <Clock className="h-8 w-8 text-cyan-accent mx-auto animate-pulse" />
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                        AI Synthesis Pending
                      </h4>
                      <p className="text-[10px] text-slate-400 leading-relaxed">
                        This intermediate frame has not been generated yet. Switch to Workflow View, lock anchors, and click "Interpolate" to synthesize it.
                      </p>
                    </div>
                  )
                ) : (
                  <>
                    {/* 1. Draggable Comparison Slider */}
                    {activeTab === "slider" && hasGroundTruth && (
                      isPendingGeneration ? (
                        <div className="text-center p-6 max-w-sm space-y-3 font-mono select-none">
                          <Clock className="h-8 w-8 text-cyan-accent mx-auto animate-pulse" />
                          <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                            AI Synthesis Pending
                          </h4>
                          <p className="text-[10px] text-slate-400 leading-relaxed">
                            This intermediate frame has not been generated yet. Switch to Workflow View, lock anchors, and click "Interpolate" to synthesize it.
                          </p>
                        </div>
                      ) : (
                        <div 
                          ref={sliderContainerRef}
                          onMouseDown={handleMouseDown}
                          onTouchStart={handleTouchStart}
                          className="absolute inset-0 cursor-ew-resize overflow-hidden w-full h-full"
                        >
                          <img 
                            src={resolvedImageUrl} 
                            alt="AI Generated" 
                            className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                            draggable={false}
                          />
                          <div className="absolute top-3 right-3 bg-space-navy-950/90 border border-cyan-accent/30 px-2 py-1 rounded-lg text-[8px] font-mono font-black text-cyan-accent uppercase tracking-widest pointer-events-none backdrop-blur-sm">
                            {resolvedAiLabel}
                          </div>

                          <div 
                            className="absolute inset-0 overflow-hidden w-full h-full pointer-events-none"
                            style={{ clipPath: `polygon(0 0, ${sliderPos}% 0, ${sliderPos}% 100%, 0 100%)` }}
                          >
                            <img 
                              src={gtImageUrl} 
                              alt="Ground Truth" 
                              className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                              draggable={false}
                            />
                          </div>
                          <div className="absolute top-3 left-3 bg-space-navy-950/90 border border-space-navy-800 px-2 py-1 rounded-lg text-[8px] font-mono font-black text-white uppercase tracking-widest pointer-events-none backdrop-blur-sm">
                            [ Ground Truth ]
                          </div>

                          <div 
                            className="absolute top-0 bottom-0 w-0.5 bg-cyan-accent shadow-[0_0_12px_#00f5d4] pointer-events-none"
                            style={{ left: `${sliderPos}%` }}
                          >
                            <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 bg-space-navy-950 border-2 border-cyan-accent rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(0,245,212,0.4)]">
                              <Sliders className="h-3.5 w-3.5 text-cyan-accent" />
                            </div>
                          </div>
                        </div>
                      )
                    )}

                    {/* 2. Ground Truth Full View */}
                    {activeTab === "gt" && hasGroundTruth && (
                      <>
                        <img 
                          src={gtImageUrl} 
                          alt="Ground Truth" 
                          className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                          draggable={false}
                        />
                        <div className="absolute top-3 left-3 bg-space-navy-950/90 border border-space-navy-800 px-2.5 py-1 rounded-lg text-[8px] font-mono font-black text-white uppercase tracking-widest backdrop-blur-sm">
                          [ Ground Truth ]
                        </div>
                      </>
                    )}

                    {/* Fallback for missing GT (applies to slider and GT tabs if GT is missing) */}
                    {(!hasGroundTruth && (activeTab === "gt" || activeTab === "slider")) && (
                      <div className="text-center p-6 max-w-sm space-y-3 font-mono">
                        <ShieldAlert className="h-8 w-8 text-amber-500 mx-auto animate-pulse" />
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                          Ground Truth unavailable
                        </h4>
                        <p className="text-[10px] text-slate-400 leading-relaxed">
                          This frame exceeds the native temporal resolution of the satellite.
                        </p>
                      </div>
                    )}

                    {/* 3. AI Generated Full View */}
                    {activeTab === "ai" && (
                      isPendingGeneration ? (
                        <div className="text-center p-6 max-w-sm space-y-3 font-mono select-none">
                          <Clock className="h-8 w-8 text-cyan-accent mx-auto animate-pulse" />
                          <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                            AI Synthesis Pending
                          </h4>
                          <p className="text-[10px] text-slate-400 leading-relaxed">
                            This intermediate frame has not been generated yet. Switch to Workflow View, lock anchors, and click "Interpolate" to synthesize it.
                          </p>
                        </div>
                      ) : (
                        <>
                          <img 
                            src={resolvedImageUrl} 
                            alt="AI Generated" 
                            className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                            draggable={false}
                          />
                          <div className="absolute top-3 left-3 bg-space-navy-950/90 border border-cyan-accent/30 px-2.5 py-1 rounded-lg text-[8px] font-mono font-black text-cyan-accent uppercase tracking-widest backdrop-blur-sm">
                            {resolvedAiTabLabel}
                          </div>
                        </>
                      )
                    )}

                    {/* 4. Difference Heatmap View */}
                    {activeTab === "heatmap" && (
                      isPendingGeneration ? (
                        <div className="text-center p-6 max-w-sm space-y-3 font-mono select-none">
                          <Clock className="h-8 w-8 text-cyan-accent mx-auto animate-pulse" />
                          <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                            AI Synthesis Pending
                          </h4>
                          <p className="text-[10px] text-slate-400 leading-relaxed">
                            This intermediate frame has not been generated yet. Switch to Workflow View, lock anchors, and click "Interpolate" to synthesize it.
                          </p>
                        </div>
                      ) : rawTimestamps.includes(timestamp) ? (
                        <div className="text-center p-6 max-w-sm space-y-3 font-mono select-none">
                          <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto" />
                          <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                            Zero Synthesis Discrepancy
                          </h4>
                          <p className="text-[10px] text-slate-400 leading-relaxed">
                            This is an original telemetry observation. Discrepancy maps are only computed for model-synthesized intermediate frames.
                          </p>
                        </div>
                      ) : isDifferenceMapPlaceholder ? (
                        <div className="text-center p-6 max-w-sm space-y-3 font-mono select-none">
                          <AlertTriangle className="h-8 w-8 text-amber-400 mx-auto" />
                          <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                            No reference heatmap available
                          </h4>
                          <p className="text-[10px] text-slate-500 leading-relaxed">
                            Heatmaps are unavailable for virtual timestamps lacking reference observations.
                          </p>
                        </div>
                      ) : (
                        <>
                          <img 
                            src={diffImageUrl} 
                            alt="Difference Map" 
                            className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                            draggable={false}
                          />
                          <div className="absolute top-3 left-3 bg-space-navy-950/90 border border-rose-500/30 px-2.5 py-1 rounded-lg text-[8px] font-mono font-black text-rose-400 uppercase tracking-widest backdrop-blur-sm">
                            [ Difference Map Heatmap ]
                          </div>
                        </>
                      )
                    )}
                  </>
                )}

              </div>

            </div>
          ) : (
            /* ========================================================
               SYNCHRONIZED PLAYBACK COMPARISON VIEW
               ======================================================== */
            <div className="flex flex-col space-y-4">
              
              {/* Twin Player Panels */}
              <div className="grid grid-cols-2 gap-4">
                
                {/* Left Side: Original sequence */}
                <div className="bg-space-navy-950 border border-space-navy-800 rounded-xl aspect-square relative overflow-hidden flex items-center justify-center shadow-xl">
                  <img 
                    src={getOriginalTelemetryUrl()} 
                    alt="Original Telemetry Sequence" 
                    className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                    draggable={false}
                  />
                  <div className="absolute top-2 left-2 bg-space-navy-950/90 border border-space-navy-800 px-2 py-0.5 rounded-lg text-[8px] font-mono font-black text-white uppercase tracking-wider backdrop-blur-sm">
                    Original — 30 min jumps
                  </div>
                  <div className="absolute bottom-2 left-2 bg-space-navy-950/90 border border-space-navy-800 px-2 py-0.5 rounded-lg text-[8px] font-mono text-slate-400 backdrop-blur-sm">
                    {getOriginalTelemetryTimestamp()} UTC (Raw)
                  </div>
                </div>

                {/* Right Side: Enhanced sequence */}
                <div className="bg-space-navy-950 border border-cyan-accent/20 rounded-xl aspect-square relative overflow-hidden flex items-center justify-center shadow-xl shadow-cyan-accent/5">
                  <img 
                    src={rawTimestamps.includes(currentTime) && !generatedTimestamps.includes(currentTime) ? gtImageUrl : imageUrl} 
                    alt="AI Enhanced Sequence" 
                    className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                    draggable={false}
                  />
                  <div className="absolute top-2 left-2 bg-space-navy-950/90 border border-cyan-accent/30 px-2 py-0.5 rounded-lg text-[8px] font-mono font-black text-cyan-accent uppercase tracking-wider backdrop-blur-sm">
                    AI Enhanced — Smooth
                  </div>
                  <div className="absolute bottom-2 left-2 bg-space-navy-950/90 border border-cyan-accent/20 px-2 py-0.5 rounded-lg text-[8px] font-mono text-cyan-accent backdrop-blur-sm">
                    {currentTime} UTC ({rawTimestamps.includes(currentTime) ? "Raw" : "AI Synthesized"})
                  </div>
                </div>

              </div>

              {/* Synchronized Playback Control Dashboard */}
              <div className="bg-space-navy-900 border border-space-navy-800 p-4 rounded-xl flex flex-col space-y-3 select-none shadow-lg">
                
                {/* Active Slider Progress Bar */}
                <div className="flex items-center space-x-4">
                  <span className="text-[10px] font-mono text-slate-400 w-12 text-left">
                    {activeTimeline[0]}
                  </span>
                  
                  <input 
                    type="range" 
                    min="0" 
                    max={activeTimeline.length - 1} 
                    value={activeTimeline.indexOf(currentTime) === -1 ? 0 : activeTimeline.indexOf(currentTime)}
                    onChange={(e) => {
                      const idx = parseInt(e.target.value);
                      if (!isNaN(idx) && activeTimeline[idx]) {
                        setCurrentTime(activeTimeline[idx]);
                      }
                    }}
                    className="grow h-1.5 bg-space-navy-950 rounded-lg appearance-none cursor-pointer accent-cyan-accent"
                  />
                  
                  <span className="text-[10px] font-mono text-slate-400 w-12 text-right">
                    {activeTimeline[activeTimeline.length - 1]}
                  </span>
                </div>

                {/* Control Action Buttons */}
                <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
                  
                  {/* Current Active Timestamp readout */}
                  <div className="flex items-center space-x-2 font-mono text-xs text-white">
                    <Clock className="h-3.5 w-3.5 text-cyan-accent" />
                    <span className="text-slate-400">Time Step:</span>
                    <span className="text-cyan-accent font-black">{currentTime} UTC</span>
                  </div>

                  {/* Play, Pause, Navigation controls */}
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={handlePrevFrame}
                      className="bg-space-navy-950 hover:bg-space-navy-800 border border-space-navy-800 hover:border-slate-600 p-2 rounded-lg text-slate-400 hover:text-white transition-all cursor-pointer"
                      title="Previous frame"
                    >
                      <SkipBack className="h-4 w-4" />
                    </button>

                    <button 
                      onClick={() => setIsPlaying(!isPlaying)}
                      className="bg-cyan-accent hover:brightness-110 text-space-navy-950 p-2.5 rounded-lg transition-all shadow-[0_0_16px_rgba(0,245,212,0.4)] cursor-pointer"
                      title={isPlaying ? "Pause Sequence" : "Play Sequence"}
                    >
                      {isPlaying ? <Pause className="h-4 w-4 fill-space-navy-950" /> : <Play className="h-4 w-4 fill-space-navy-950" />}
                    </button>

                    <button 
                      onClick={handleNextFrame}
                      className="bg-space-navy-950 hover:bg-space-navy-800 border border-space-navy-800 hover:border-slate-600 p-2 rounded-lg text-slate-400 hover:text-white transition-all cursor-pointer"
                      title="Next frame"
                    >
                      <SkipForward className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Playback mode filter */}
                  <div className="flex bg-space-navy-950 p-0.5 rounded-lg border border-space-navy-800 text-[9px] font-mono select-none">
                    <button
                      onClick={() => {
                        setPlaybackSequence("raw");
                        if (!rawTimestamps.includes(currentTime)) {
                          setCurrentTime(rawTimestamps[0]);
                        }
                      }}
                      className={`px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${
                        playbackSequence === "raw"
                          ? "bg-cyan-accent text-space-navy-950"
                          : "text-slate-400 hover:text-white"
                      }`}
                      title="Loop through raw telemetry observations only"
                    >
                      Original Only
                    </button>
                    <button
                      onClick={() => setPlaybackSequence("all")}
                      className={`px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${
                        playbackSequence === "all"
                          ? "bg-cyan-accent text-space-navy-950"
                          : "text-slate-400 hover:text-white"
                      }`}
                      title="Loop through raw observations and synthesized AI frames"
                    >
                      AI Enhanced
                    </button>
                  </div>

                  {/* Playback speed selector multipliers */}
                  <div className="flex bg-space-navy-950 p-0.5 rounded-lg border border-space-navy-800 text-[9px] font-mono select-none">
                    {([0.5, 1, 2] as const).map((spd) => (
                      <button
                        key={spd}
                        onClick={() => setPlaybackSpeed(spd)}
                        className={`px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${
                          playbackSpeed === spd
                            ? "bg-cyan-accent text-space-navy-950"
                            : "text-slate-400 hover:text-white"
                        }`}
                      >
                        {spd}x
                      </button>
                    ))}
                  </div>

                </div>

              </div>

            </div>
          )}

        </div>

        {/* RIGHT COLUMN: CONTROLS & SCIENTIFIC SCHEMAS */}
        <div className="lg:col-span-4 flex flex-col space-y-4">
          
          {/* A. Validation Status Panel Card */}
          <div className="bg-space-navy-900 border border-space-navy-800 p-4 rounded-xl flex flex-col space-y-3 select-none shadow-lg">
            <div className="flex items-center space-x-2 border-b border-space-navy-800 pb-2.5">
              <div className={`h-2 w-2 rounded-full ${hasGroundTruth ? "bg-emerald-400 shadow-[0_0_6px_#34d399]" : "bg-amber-400 shadow-[0_0_6px_#fbbf24]"}`} />
              <span className="text-[9px] font-mono text-slate-400 uppercase tracking-widest font-black">
                Frame Metadata
              </span>
            </div>

            <div className="grid grid-cols-2 gap-y-2.5 gap-x-4 text-[10px] font-mono">
              <span className="text-slate-500">Ground Truth:</span>
              <span className={`font-bold text-right ${hasGroundTruth ? "text-emerald-400" : "text-amber-400"}`}>
                {hasGroundTruth ? "✓ Available" : "⚠ Not Available"}
              </span>

              <span className="text-slate-500">Generated At:</span>
              <span className="text-cyan-accent text-right font-bold">{timestamp} UTC</span>

              <span className="text-slate-500">Parents:</span>
              <span className="text-slate-300 text-right font-bold">
                {parentA && parentB ? `${parentA} & ${parentB}` : "Original"}
              </span>

              <span className="text-slate-500">Depth:</span>
              <span className="text-slate-300 text-right">
                {parentA && parentB ? `Level ${interpolationDepth}` : "N/A"}
              </span>

              <span className="text-slate-500">Resolution:</span>
              <span className="text-slate-300 text-right">{temporalResolution}</span>

              <span className="text-slate-500">Model:</span>
              <span className="text-slate-300 text-right font-semibold truncate" title={resolvedModelVersion}>{resolvedModelVersion}</span>

              <span className="text-slate-500">Inference:</span>
              <span className="text-slate-300 text-right">
                {inferenceTimeMs === null ? "N/A" : inferenceTimeMs === 0 ? "Cached" : `${inferenceTimeMs.toFixed(1)} ms`}
              </span>
            </div>
          </div>

          {/* B. Scientific Metrics Panel Card */}
          <div className="bg-space-navy-900 border border-space-navy-800 p-4 rounded-xl flex flex-col space-y-3 grow shadow-lg">
            
            <div className="flex items-center justify-between border-b border-space-navy-800 pb-2.5">
              <div className="flex items-center space-x-2">
                <div className="h-6 w-6 rounded-md bg-cyan-accent/10 border border-cyan-accent/20 flex items-center justify-center">
                  <BarChart3 className="h-3.5 w-3.5 text-cyan-accent" />
                </div>
                <span className="text-[9px] font-mono text-white uppercase tracking-widest font-black">
                  Quality Metrics
                </span>
              </div>
              <span className="text-[8px] font-mono text-slate-500 uppercase bg-space-navy-950 border border-space-navy-800 px-1.5 py-0.5 rounded">
                ISRO PS-12
              </span>
            </div>

            {/* ─── NO GROUND TRUTH: Show Model Best Validation SSIM ─────────── */}
            {!hasGroundTruth && isFrameGenerated && (
              <div className="space-y-3">
                {/* Banner explaining the situation */}
                <div className="bg-amber-500/8 border border-amber-500/25 rounded-xl p-3 space-y-1.5">
                  <div className="flex items-center space-x-1.5">
                    <ShieldAlert className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                    <span className="text-[9px] font-mono font-black text-amber-300 uppercase tracking-wide">
                      No Ground Truth Reference
                    </span>
                  </div>
                  <p className="text-[9px] font-mono text-slate-400 leading-relaxed">
                    This timestamp exceeds satellite native resolution — no real observation exists to compare against. Per-frame SSIM/PSNR cannot be computed.
                  </p>
                </div>

                {/* Best Validation SSIM highlight card */}
                <div className="bg-gradient-to-br from-cyan-accent/8 to-electric-blue/5 border border-cyan-accent/30 rounded-xl p-3.5 space-y-2.5 relative overflow-hidden">
                  {/* Glow accent */}
                  <div className="absolute top-0 right-0 w-16 h-16 bg-cyan-accent/5 rounded-full blur-2xl pointer-events-none" />
                  
                  <div className="flex items-center space-x-2">
                    <div className="h-6 w-6 rounded-lg bg-cyan-accent/15 border border-cyan-accent/30 flex items-center justify-center">
                      <Award className="h-3.5 w-3.5 text-cyan-accent" />
                    </div>
                    <div>
                      <span className="text-[8px] font-mono text-cyan-accent uppercase tracking-widest font-black block">
                        Best Validation Score
                      </span>
                      <span className="text-[7px] font-mono text-slate-500 uppercase tracking-wider">
                        Epoch {MODEL_BEST_VAL_EPOCH} · Hold-out Validation Set
                      </span>
                    </div>
                  </div>

                  <div className="flex items-end justify-between">
                    <div>
                      <span className="text-2xl font-heading font-black text-cyan-accent tracking-tight">
                        {MODEL_BEST_VAL_SSIM.toFixed(4)}
                      </span>
                      <span className="text-[9px] font-mono text-slate-400 ml-1.5">SSIM</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[8px] font-mono text-emerald-400 block font-bold">≈ 93.2%</span>
                      <span className="text-[7px] font-mono text-slate-500">structural accuracy</span>
                    </div>
                  </div>

                  <MetricBar value={MODEL_BEST_VAL_SSIM} max={1} />

                  <div className="bg-space-navy-900/70 border border-space-navy-800 rounded-lg p-2 mt-1">
                    <p className="text-[8px] font-mono text-slate-400 leading-relaxed">
                      <span className="text-white font-black">Note:</span> This is the model's best SSIM achieved on the validation dataset during training. It reflects generalisation performance — not this specific frame's quality, which cannot be measured without a ground truth reference.
                    </p>
                  </div>
                </div>

                {/* Other metrics shown as N/A with explanation */}
                <div className="grid grid-cols-2 gap-2">
                  {(["PSNR", "MSE", "FSIM"] as const).map((m) => (
                    <div key={m} className="bg-space-navy-950 border border-space-navy-800 p-2 rounded-lg text-center">
                      <span className="text-[8px] font-mono text-slate-600 uppercase tracking-wider block mb-0.5">{m}</span>
                      <span className="text-[10px] font-mono text-slate-700 font-bold">N/A</span>
                    </div>
                  ))}
                  <div className="bg-space-navy-950/60 border border-dashed border-space-navy-800 p-2 rounded-lg text-center flex items-center justify-center">
                    <span className="text-[7px] font-mono text-slate-600 leading-tight text-center">Requires<br/>GT ref.</span>
                  </div>
                </div>
              </div>
            )}

            {/* ─── HAS GROUND TRUTH: Show actual computed metrics ────────────── */}
            {hasGroundTruth && (
              <>
                {metrics ? (
                  <div className="text-[9px] text-slate-400 font-mono leading-normal">
                    Live metrics — AI synthesis vs. actual satellite observation:
                  </div>
                ) : (
                  <div className="text-[9px] text-slate-500 font-mono leading-normal">
                    Ground truth available. Run interpolation to compute metrics.
                  </div>
                )}

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 gap-2.5">
                  
                  {/* SSIM */}
                  <div className="bg-space-navy-950 border border-space-navy-800 hover:border-cyan-accent/30 p-3 rounded-xl group relative select-none transition-colors">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[9px] font-mono text-slate-400 font-bold uppercase tracking-wider">SSIM</span>
                      <HelpCircle className="h-3 w-3 text-slate-600 hover:text-cyan-accent cursor-help" />
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 hidden group-hover:block bg-black/95 border border-space-navy-800 text-[9px] text-slate-300 p-2.5 rounded-xl shadow-2xl z-20 font-sans pointer-events-none leading-relaxed">
                        <strong className="text-white uppercase block mb-1">{metricConfigs.ssim.fullName}</strong>
                        <p className="mb-1">{metricConfigs.ssim.desc}</p>
                        <p className="text-emerald-400 mb-1"><strong>Range:</strong> {metricConfigs.ssim.range}</p>
                        <p className="text-cyan-accent"><strong>Why it matters:</strong> {metricConfigs.ssim.matters}</p>
                      </div>
                    </div>
                    <span className="text-lg font-heading font-black text-white">
                      {metrics ? metrics.ssim.toFixed(4) : <span className="text-slate-600 text-[10px] font-mono font-normal">—</span>}
                    </span>
                    {metrics && <MetricBar value={metrics.ssim} />}
                  </div>

                  {/* PSNR */}
                  <div className="bg-space-navy-950 border border-space-navy-800 hover:border-cyan-accent/30 p-3 rounded-xl group relative select-none transition-colors">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[9px] font-mono text-slate-400 font-bold uppercase tracking-wider">PSNR</span>
                      <HelpCircle className="h-3 w-3 text-slate-600 hover:text-cyan-accent cursor-help" />
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 hidden group-hover:block bg-black/95 border border-space-navy-800 text-[9px] text-slate-300 p-2.5 rounded-xl shadow-2xl z-20 font-sans pointer-events-none leading-relaxed">
                        <strong className="text-white uppercase block mb-1">{metricConfigs.psnr.fullName}</strong>
                        <p className="mb-1">{metricConfigs.psnr.desc}</p>
                        <p className="text-emerald-400 mb-1"><strong>Range:</strong> {metricConfigs.psnr.range}</p>
                        <p className="text-cyan-accent"><strong>Why it matters:</strong> {metricConfigs.psnr.matters}</p>
                      </div>
                    </div>
                    <span className="text-lg font-heading font-black text-white">
                      {metrics ? `${metrics.psnr.toFixed(2)} dB` : <span className="text-slate-600 text-[10px] font-mono font-normal">—</span>}
                    </span>
                    {metrics && <MetricBar value={Math.min(metrics.psnr / 45, 1)} />}
                  </div>

                  {/* MSE */}
                  <div className="bg-space-navy-950 border border-space-navy-800 hover:border-cyan-accent/30 p-3 rounded-xl group relative select-none transition-colors">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[9px] font-mono text-slate-400 font-bold uppercase tracking-wider">MSE</span>
                      <HelpCircle className="h-3 w-3 text-slate-600 hover:text-cyan-accent cursor-help" />
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 hidden group-hover:block bg-black/95 border border-space-navy-800 text-[9px] text-slate-300 p-2.5 rounded-xl shadow-2xl z-20 font-sans pointer-events-none leading-relaxed">
                        <strong className="text-white uppercase block mb-1">{metricConfigs.mse.fullName}</strong>
                        <p className="mb-1">{metricConfigs.mse.desc}</p>
                        <p className="text-emerald-400 mb-1"><strong>Range:</strong> {metricConfigs.mse.range}</p>
                        <p className="text-cyan-accent"><strong>Why it matters:</strong> {metricConfigs.mse.matters}</p>
                      </div>
                    </div>
                    <span className="text-lg font-heading font-black text-white">
                      {metrics ? metrics.mse.toFixed(2) : <span className="text-slate-600 text-[10px] font-mono font-normal">—</span>}
                    </span>
                    {metrics && <MetricBar value={1 - Math.min(metrics.mse / 100, 1)} />}
                  </div>

                  {/* FSIM */}
                  <div className="bg-space-navy-950 border border-space-navy-800 hover:border-cyan-accent/30 p-3 rounded-xl group relative select-none transition-colors">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[9px] font-mono text-slate-400 font-bold uppercase tracking-wider">FSIM</span>
                      <HelpCircle className="h-3 w-3 text-slate-600 hover:text-cyan-accent cursor-help" />
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 hidden group-hover:block bg-black/95 border border-space-navy-800 text-[9px] text-slate-300 p-2.5 rounded-xl shadow-2xl z-20 font-sans pointer-events-none leading-relaxed">
                        <strong className="text-white uppercase block mb-1">{metricConfigs.fsim.fullName}</strong>
                        <p className="mb-1">{metricConfigs.fsim.desc}</p>
                        <p className="text-emerald-400 mb-1"><strong>Range:</strong> {metricConfigs.fsim.range}</p>
                        <p className="text-cyan-accent"><strong>Why it matters:</strong> {metricConfigs.fsim.matters}</p>
                      </div>
                    </div>
                    <span className="text-lg font-heading font-black text-white">
                      {metrics ? metrics.fsim.toFixed(4) : <span className="text-slate-600 text-[10px] font-mono font-normal">—</span>}
                    </span>
                    {metrics && <MetricBar value={metrics.fsim} />}
                  </div>

                </div>
              </>
            )}

            {/* Raw frame — no metrics needed */}
            {!isFrameGenerated && rawTimestamps.includes(timestamp) && (
              <div className="flex flex-col items-center justify-center text-center py-4 space-y-2 select-none">
                <CheckCircle2 className="h-7 w-7 text-emerald-400" />
                <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider">
                  Native Satellite Observation
                </span>
                <span className="text-[8px] font-mono text-slate-600">
                  No synthesis performed — metrics N/A
                </span>
              </div>
            )}

            {/* Pipeline Workflow Summary Card */}
            <div className="border-t border-space-navy-800 pt-3 mt-auto space-y-2">
              <span className="text-[8px] font-mono text-slate-600 uppercase tracking-widest block select-none">
                [ Pipeline Flow ]
              </span>
              <div className="bg-space-navy-950 border border-space-navy-800 p-2 rounded-lg flex items-center justify-between text-[7px] font-mono text-slate-500 uppercase select-none">
                <span>NetCDF</span>
                <ChevronRight className="h-2 w-2 text-cyan-accent/60" />
                <span>Flow Net</span>
                <ChevronRight className="h-2 w-2 text-cyan-accent/60" />
                <span>RIFE Warp</span>
                <ChevronRight className="h-2 w-2 text-cyan-accent/60" />
                <span>Fusion</span>
                <ChevronRight className="h-2 w-2 text-cyan-accent/60" />
                <span>Output NC</span>
              </div>
            </div>
            
          </div>

        </div>

      </div>

      {/* 3. VALIDATION SUMMARY (Bottom Panel) */}
      <section className="bg-space-navy-900 border border-space-navy-800 p-5 rounded-xl select-none shadow-lg">
        <div className="flex items-center justify-between border-b border-space-navy-800 pb-3 mb-4">
          <div className="flex items-center space-x-2">
            <Zap className="h-4 w-4 text-cyan-accent" />
            <span className="text-[9px] font-mono text-white uppercase tracking-widest font-black">
              Dataset Validation Summary
            </span>
          </div>
          <span className="text-[8px] font-mono text-slate-600 uppercase bg-space-navy-950 border border-space-navy-800 px-2 py-0.5 rounded-md">
            Epoch {MODEL_BEST_VAL_EPOCH} · Best Checkpoint
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          
          <div className="bg-space-navy-950 border border-space-navy-800 p-3 rounded-xl">
            <span className="text-[8px] font-mono text-slate-500 uppercase tracking-wider block mb-1">Generated</span>
            <span className="text-xl font-heading font-black text-white">{statsSummary.totalGenerated}</span>
            <span className="text-[7px] font-mono text-slate-600 block">frames</span>
          </div>

          <div className="bg-space-navy-950 border border-cyan-accent/20 p-3 rounded-xl">
            <span className="text-[8px] font-mono text-slate-500 uppercase tracking-wider block mb-1">Validated</span>
            <span className="text-xl font-heading font-black text-cyan-accent">{statsSummary.totalValidated}</span>
            <span className="text-[7px] font-mono text-slate-600 block">with GT ref</span>
          </div>

          {/* Always show model best val SSIM */}
          <div className="bg-gradient-to-br from-cyan-accent/8 to-transparent border border-cyan-accent/25 p-3 rounded-xl">
            <span className="text-[8px] font-mono text-cyan-accent uppercase tracking-wider block mb-1 font-bold">Best Val SSIM</span>
            <span className="text-xl font-heading font-black text-cyan-accent">{MODEL_BEST_VAL_SSIM.toFixed(4)}</span>
            <span className="text-[7px] font-mono text-slate-500 block">epoch {MODEL_BEST_VAL_EPOCH}</span>
          </div>

          {statsSummary.eligible ? (
            <>
              <div className="bg-space-navy-950 border border-space-navy-800 p-3 rounded-xl">
                <span className="text-[8px] font-mono text-slate-500 uppercase tracking-wider block mb-1">Avg SSIM</span>
                <span className="text-xl font-heading font-black text-white">{statsSummary.avgSsim!.toFixed(4)}</span>
              </div>

              <div className="bg-space-navy-950 border border-space-navy-800 p-3 rounded-xl">
                <span className="text-[8px] font-mono text-slate-500 uppercase tracking-wider block mb-1">Avg PSNR</span>
                <span className="text-xl font-heading font-black text-white">{statsSummary.avgPsnr!.toFixed(2)} dB</span>
              </div>

              <div className="bg-space-navy-950 border border-space-navy-800 p-3 rounded-xl">
                <span className="text-[8px] font-mono text-slate-500 uppercase tracking-wider block mb-1">Avg FSIM</span>
                <span className="text-xl font-heading font-black text-white">{statsSummary.avgFsim!.toFixed(4)}</span>
              </div>

              <div className="bg-space-navy-950 border border-space-navy-800 p-3 rounded-xl">
                <span className="text-[8px] font-mono text-slate-500 uppercase tracking-wider block mb-1">Avg Inference</span>
                <span className="text-xl font-heading font-black text-slate-300">
                  {statsSummary.avgInf! === 0 ? "Cached" : `${statsSummary.avgInf!.toFixed(0)} ms`}
                </span>
              </div>
            </>
          ) : (
            <div className="md:col-span-1 lg:col-span-4 bg-space-navy-950/60 border border-dashed border-space-navy-800 p-3 rounded-xl flex items-center justify-center text-[9px] font-mono text-slate-600 uppercase tracking-wider text-center leading-relaxed">
              Generate & validate more frames to unlock session-level statistics
            </div>
          )}

        </div>
      </section>

    </div>
  );
}
