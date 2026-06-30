"use client";

import React, { useState, useRef, useEffect } from "react";
import { 
  Info, HelpCircle, Download, ToggleRight, Sliders, Image, Activity, 
  AlertTriangle, GitCommit, Clock, Play, Pause, SkipForward, SkipBack,
  Layers, CheckCircle2, ChevronRight, BarChart3, ShieldAlert
} from "lucide-react";
import { getApiUrl } from "@/utils/api";

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
      const currIndex = sortedTimeline.indexOf(latestTime);
      if (currIndex === -1 || currIndex === sortedTimeline.length - 1) {
        setCurrentTime(sortedTimeline[0]);
      } else {
        setCurrentTime(sortedTimeline[currIndex + 1]);
      }
    }, delay);
    return () => clearInterval(intervalId);
  }, [isPlaying, playbackSpeed, sortedTimeline, setCurrentTime]);

  const handlePrevFrame = () => {
    const currIndex = sortedTimeline.indexOf(currentTime);
    if (currIndex > 0) {
      setCurrentTime(sortedTimeline[currIndex - 1]);
    } else {
      setCurrentTime(sortedTimeline[sortedTimeline.length - 1]);
    }
  };

  const handleNextFrame = () => {
    const currIndex = sortedTimeline.indexOf(currentTime);
    if (currIndex !== -1 && currIndex < sortedTimeline.length - 1) {
      setCurrentTime(sortedTimeline[currIndex + 1]);
    } else {
      setCurrentTime(sortedTimeline[0]);
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
    const cleanT = bestRaw.replace(":", "");
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
      <section className="bg-space-navy-900 border border-space-navy-850 p-3 rounded-lg flex items-center justify-between gap-4 select-none">
        <div className="flex items-center space-x-2">
          <BarChart3 className="h-4 w-4 text-cyan-accent" />
          <h2 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
            Compare Workspace Mode
          </h2>
        </div>
        
        {/* Toggle options between Single Frame vs Animation playbacks */}
        <div className="flex bg-space-navy-950 p-0.5 rounded border border-space-navy-800 text-[10px] font-mono">
          <button
            onClick={() => { setWorkspaceMode("single"); setIsPlaying(false); }}
            className={`px-3 py-1 rounded font-bold transition-all cursor-pointer ${
              workspaceMode === "single"
                ? "bg-cyan-accent text-space-navy-950 shadow-[0_0_8px_rgba(0,245,212,0.4)]"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Single Frame Analysis
          </button>
          <button
            onClick={() => setWorkspaceMode("playback")}
            className={`px-3 py-1 rounded font-bold transition-all cursor-pointer ${
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
                <div className="flex items-center justify-between bg-space-navy-900 border border-space-navy-850 p-1.5 rounded-lg select-none">
                  <div className="flex bg-space-navy-950 p-0.5 rounded border border-space-navy-800 text-[10px] font-mono">
                    {hasGroundTruth ? (
                      <button
                        onClick={() => setActiveTab("slider")}
                        className={`px-3.5 py-1.5 rounded font-bold transition-all flex items-center space-x-1 cursor-pointer ${
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
                        className={`px-3.5 py-1.5 rounded font-bold transition-all flex items-center space-x-1 cursor-pointer ${
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
                      className={`px-3.5 py-1.5 rounded font-bold transition-all flex items-center space-x-1 cursor-pointer ${
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
                      className={`px-3.5 py-1.5 rounded font-bold transition-all flex items-center space-x-1 cursor-pointer ${
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
                        className="bg-space-navy-950 hover:bg-space-navy-900 border border-space-navy-800 text-slate-300 hover:text-white px-2.5 py-1.5 rounded text-[10px] font-mono font-bold flex items-center space-x-1 transition-all cursor-pointer"
                      >
                        <Download className="h-3 w-3" />
                        <span>Download GT</span>
                      </a>
                    )}
                    {(activeTab === "ai" || activeTab === "slider") && downloadNcUrl && (
                      <a
                        href={downloadNcUrl}
                        download
                        className="bg-space-navy-950 hover:bg-space-navy-900 border border-space-navy-800 text-slate-300 hover:text-white px-2.5 py-1.5 rounded text-[10px] font-mono font-bold flex items-center space-x-1 transition-all cursor-pointer"
                      >
                        <Download className="h-3 w-3" />
                        <span>Download AI</span>
                      </a>
                    )}
                    {activeTab === "heatmap" && !isDifferenceMapPlaceholder && downloadDiffNcUrl && (
                      <a
                        href={downloadDiffNcUrl}
                        download
                        className="bg-space-navy-950 hover:bg-space-navy-900 border border-space-navy-800 text-slate-300 hover:text-white px-2.5 py-1.5 rounded text-[10px] font-mono font-bold flex items-center space-x-1 transition-all cursor-pointer"
                      >
                        <Download className="h-3 w-3" />
                        <span>Download Diff</span>
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* View Panel Display Box */}
              <div className="bg-space-navy-950 border border-space-navy-850 rounded-lg aspect-square md:aspect-[4/3] w-full relative overflow-hidden flex items-center justify-center select-none shadow-xl">
                
                {!isFrameGenerated ? (
                  rawTimestamps.includes(timestamp) ? (
                    <>
                      <img 
                        src={gtImageUrl} 
                        alt="Ground Truth" 
                        className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                        draggable={false}
                      />
                      <div className="absolute top-3 left-3 bg-space-navy-950/80 border border-space-navy-800 px-2.5 py-0.5 rounded text-[8px] font-mono font-black text-white uppercase tracking-widest">
                        [ Original Observation (Raw) ]
                      </div>
                      <div className="absolute bottom-3 left-3 right-3 bg-space-navy-950/90 border border-cyan-accent/30 p-2.5 rounded text-[9px] font-mono text-cyan-accent flex items-center space-x-2 backdrop-blur-sm shadow-[0_0_10px_rgba(0,245,212,0.1)]">
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
                          <div className="absolute top-3 right-3 bg-space-navy-950/80 border border-space-navy-800 px-2 py-0.5 rounded text-[8px] font-mono font-black text-cyan-accent uppercase tracking-widest pointer-events-none">
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
                          <div className="absolute top-3 left-3 bg-space-navy-950/80 border border-space-navy-800 px-2 py-0.5 rounded text-[8px] font-mono font-black text-white uppercase tracking-widest pointer-events-none">
                            [ Ground Truth ]
                          </div>

                          <div 
                            className="absolute top-0 bottom-0 w-0.5 bg-cyan-accent shadow-[0_0_10px_#00f5d4] pointer-events-none"
                            style={{ left: `${sliderPos}%` }}
                          >
                            <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-7 h-7 bg-space-navy-950 border border-cyan-accent rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(0,245,212,0.3)]">
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
                        <div className="absolute top-3 left-3 bg-space-navy-950/80 border border-space-navy-800 px-2.5 py-0.5 rounded text-[8px] font-mono font-black text-white uppercase tracking-widest">
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
                          <div className="absolute top-3 left-3 bg-space-navy-950/80 border border-space-navy-800 px-2.5 py-0.5 rounded text-[8px] font-mono font-black text-cyan-accent uppercase tracking-widest">
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
                          <div className="absolute top-3 left-3 bg-space-navy-950/80 border border-space-navy-800 px-2.5 py-0.5 rounded text-[8px] font-mono font-black text-rose-400 uppercase tracking-widest">
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
                <div className="bg-space-navy-950 border border-space-navy-850 rounded-lg aspect-square relative overflow-hidden flex items-center justify-center">
                  <img 
                    src={getOriginalTelemetryUrl()} 
                    alt="Original Telemetry Sequence" 
                    className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                    draggable={false}
                  />
                  <div className="absolute top-2 left-2 bg-space-navy-950/80 border border-space-navy-800 px-2 py-0.5 rounded text-[8px] font-mono font-black text-white uppercase tracking-wider">
                    Original Sequence (Jumping)
                  </div>
                  <div className="absolute bottom-2 left-2 bg-space-navy-950/80 border border-space-navy-800 px-2 py-0.5 rounded text-[8px] font-mono text-slate-400">
                    Displaying: {getOriginalTelemetryTimestamp()} UTC (Raw)
                  </div>
                </div>

                {/* Right Side: Enhanced sequence */}
                <div className="bg-space-navy-950 border border-space-navy-850 rounded-lg aspect-square relative overflow-hidden flex items-center justify-center">
                  <img 
                    src={imageUrl} 
                    alt="AI Enhanced Sequence" 
                    className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                    draggable={false}
                  />
                  <div className="absolute top-2 left-2 bg-space-navy-950/80 border border-space-navy-800 px-2 py-0.5 rounded text-[8px] font-mono font-black text-cyan-accent uppercase tracking-wider">
                    AI Enhanced (Smooth)
                  </div>
                  <div className="absolute bottom-2 left-2 bg-space-navy-950/80 border border-space-navy-800 px-2 py-0.5 rounded text-[8px] font-mono text-cyan-accent">
                    Displaying: {currentTime} UTC ({rawTimestamps.includes(currentTime) ? "Raw" : "AI"})
                  </div>
                </div>

              </div>

              {/* Synchronized Playback Control Dashboard */}
              <div className="bg-space-navy-900 border border-space-navy-850 p-4 rounded-lg flex flex-col space-y-3 select-none">
                
                {/* Active Slider Progress Bar */}
                <div className="flex items-center space-x-4">
                  <span className="text-[10px] font-mono text-slate-400 w-12 text-left">
                    {sortedTimeline[0]}
                  </span>
                  
                  <input 
                    type="range" 
                    min="0" 
                    max={sortedTimeline.length - 1} 
                    value={sortedTimeline.indexOf(currentTime)}
                    onChange={(e) => {
                      const idx = parseInt(e.target.value);
                      if (!isNaN(idx) && sortedTimeline[idx]) {
                        setCurrentTime(sortedTimeline[idx]);
                      }
                    }}
                    className="grow h-1.5 bg-space-navy-950 rounded-lg appearance-none cursor-pointer accent-cyan-accent"
                  />
                  
                  <span className="text-[10px] font-mono text-slate-400 w-12 text-right">
                    {sortedTimeline[sortedTimeline.length - 1]}
                  </span>
                </div>

                {/* Control Action Buttons */}
                <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
                  
                  {/* Current Active Timestamp readout */}
                  <div className="flex items-center space-x-2 font-mono text-xs text-white">
                    <Clock className="h-3.5 w-3.5 text-cyan-accent" />
                    <span>Time Step:</span>
                    <span className="text-cyan-accent font-bold">{currentTime} UTC</span>
                  </div>

                  {/* Play, Pause, Navigation controls */}
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={handlePrevFrame}
                      className="bg-space-navy-950 hover:bg-space-navy-800 border border-space-navy-800 p-2 rounded text-slate-400 hover:text-white transition-all cursor-pointer"
                      title="Previous frame"
                    >
                      <SkipBack className="h-4 w-4" />
                    </button>

                    <button 
                      onClick={() => setIsPlaying(!isPlaying)}
                      className="bg-cyan-accent hover:bg-cyan-accent-hover text-space-navy-950 p-2 rounded transition-all shadow-[0_0_12px_rgba(0,245,212,0.35)] cursor-pointer"
                      title={isPlaying ? "Pause Sequence" : "Play Sequence"}
                    >
                      {isPlaying ? <Pause className="h-4 w-4 fill-space-navy-950" /> : <Play className="h-4 w-4 fill-space-navy-950" />}
                    </button>

                    <button 
                      onClick={handleNextFrame}
                      className="bg-space-navy-950 hover:bg-space-navy-800 border border-space-navy-800 p-2 rounded text-slate-400 hover:text-white transition-all cursor-pointer"
                      title="Next frame"
                    >
                      <SkipForward className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Playback speed selector multipliers */}
                  <div className="flex bg-space-navy-950 p-0.5 rounded border border-space-navy-800 text-[9px] font-mono select-none">
                    {([0.5, 1, 2] as const).map((spd) => (
                      <button
                        key={spd}
                        onClick={() => setPlaybackSpeed(spd)}
                        className={`px-2.5 py-1 rounded font-bold transition-all cursor-pointer ${
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
          <div className="bg-space-navy-900 border border-space-navy-850 p-4 rounded-lg flex flex-col space-y-3 select-none">
            <div className="text-[9px] font-mono text-cyan-accent uppercase tracking-widest font-black border-b border-space-navy-850 pb-2">
              [ VALIDATION STATUS ]
            </div>

            <div className="grid grid-cols-2 gap-y-2.5 gap-x-4 text-[10px] font-mono">
              <span className="text-slate-500">Ground Truth:</span>
              <span className={`font-bold text-right ${hasGroundTruth ? "text-emerald-400" : "text-amber-400"}`}>
                {hasGroundTruth ? "✓ Available" : "⚠ Not Available"}
              </span>

              <span className="text-slate-500">Ref Time:</span>
              <span className="text-slate-300 text-right">{hasGroundTruth ? `${timestamp} UTC` : "N/A"}</span>

              <span className="text-slate-500">Gen Time:</span>
              <span className="text-cyan-accent text-right font-bold">{timestamp} UTC</span>

              <span className="text-slate-500">Parents:</span>
              <span className="text-slate-300 text-right font-bold">
                {parentA && parentB ? `${parentA} & ${parentB}` : "Original"}
              </span>

              <span className="text-slate-500">Depth:</span>
              <span className="text-slate-300 text-right">
                {parentA && parentB ? `Depth ${interpolationDepth}` : "N/A"}
              </span>

              <span className="text-slate-500">Resolution:</span>
              <span className="text-slate-300 text-right">{temporalResolution}</span>

              <span className="text-slate-500">Model Version:</span>
              <span className="text-slate-300 text-right font-semibold">{resolvedModelVersion}</span>

              <span className="text-slate-500">Inference:</span>
              <span className="text-slate-300 text-right">
                {inferenceTimeMs === null ? "N/A" : inferenceTimeMs === 0 ? "Cached" : `${inferenceTimeMs.toFixed(1)} ms`}
              </span>
            </div>
          </div>

          {/* B. Scientific Metrics Panel Card */}
          <div className="bg-space-navy-900 border border-space-navy-850 p-4 rounded-lg flex flex-col space-y-3 grow">
            
            <div className="flex items-center justify-between border-b border-space-navy-850 pb-2">
              <span className="text-[9px] font-mono text-cyan-accent uppercase tracking-widest font-black">
                [ QUALITY METRICS ]
              </span>
              <span className="text-[8px] font-mono text-slate-500 uppercase">
                ISRO PS-12 EVAL
              </span>
            </div>

            {!hasGroundTruth ? (
              <div className="bg-amber-500/5 border border-amber-500/20 p-3.5 rounded text-amber-400 space-y-1.5 select-none my-1">
                <div className="flex items-center space-x-1 font-bold">
                  <ShieldAlert className="h-4 w-4 shrink-0" />
                  <span className="text-[10px] font-heading uppercase tracking-wide">GT Unavailable</span>
                </div>
                <p className="text-[9px] font-mono leading-relaxed text-slate-300">
                  Metrics unavailable for this frame. This frame exceeds the native temporal resolution of the satellite.
                </p>
              </div>
            ) : (
              <div className="text-[10px] text-slate-400 leading-normal mb-1">
                Acquired validation metrics comparing AI synthesis with reference observation:
              </div>
            )}

            {/* Metrics List */}
            <div className="grid grid-cols-2 gap-3">
              
              {/* SSIM */}
              <div className="bg-space-navy-950 border border-space-navy-800 p-2.5 rounded group relative select-none">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[9px] font-mono text-slate-400 font-bold uppercase tracking-wider">
                    SSIM
                  </span>
                  <HelpCircle className="h-3 w-3 text-slate-500 hover:text-cyan-accent cursor-help" />
                  {/* Tooltip Popup */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 hidden group-hover:block bg-black/95 border border-space-navy-800 text-[9px] text-slate-300 p-2.5 rounded shadow-xl z-20 font-sans pointer-events-none leading-relaxed">
                    <strong className="text-white uppercase block mb-1">{metricConfigs.ssim.fullName}</strong>
                    <p className="mb-1">{metricConfigs.ssim.desc}</p>
                    <p className="text-emerald-400 mb-1"><strong>Range:</strong> {metricConfigs.ssim.range}</p>
                    <p className="text-cyan-accent"><strong>Why it matters:</strong> {metricConfigs.ssim.matters}</p>
                  </div>
                </div>
                <span className="text-sm font-heading font-black text-white">
                  {!hasGroundTruth || !metrics ? (
                    <span className="text-slate-600 text-[10px] font-mono font-normal">N/A</span>
                  ) : (
                    metrics.ssim.toFixed(4)
                  )}
                </span>
              </div>

              {/* PSNR */}
              <div className="bg-space-navy-950 border border-space-navy-800 p-2.5 rounded group relative select-none">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[9px] font-mono text-slate-400 font-bold uppercase tracking-wider">
                    PSNR
                  </span>
                  <HelpCircle className="h-3 w-3 text-slate-500 hover:text-cyan-accent cursor-help" />
                  {/* Tooltip Popup */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 hidden group-hover:block bg-black/95 border border-space-navy-800 text-[9px] text-slate-300 p-2.5 rounded shadow-xl z-20 font-sans pointer-events-none leading-relaxed">
                    <strong className="text-white uppercase block mb-1">{metricConfigs.psnr.fullName}</strong>
                    <p className="mb-1">{metricConfigs.psnr.desc}</p>
                    <p className="text-emerald-400 mb-1"><strong>Range:</strong> {metricConfigs.psnr.range}</p>
                    <p className="text-cyan-accent"><strong>Why it matters:</strong> {metricConfigs.psnr.matters}</p>
                  </div>
                </div>
                <span className="text-sm font-heading font-black text-white">
                  {!hasGroundTruth || !metrics ? (
                    <span className="text-slate-600 text-[10px] font-mono font-normal">N/A</span>
                  ) : (
                    `${metrics.psnr.toFixed(2)} dB`
                  )}
                </span>
              </div>

              {/* MSE */}
              <div className="bg-space-navy-950 border border-space-navy-800 p-2.5 rounded group relative select-none">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[9px] font-mono text-slate-400 font-bold uppercase tracking-wider">
                    MSE
                  </span>
                  <HelpCircle className="h-3 w-3 text-slate-500 hover:text-cyan-accent cursor-help" />
                  {/* Tooltip Popup */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 hidden group-hover:block bg-black/95 border border-space-navy-800 text-[9px] text-slate-300 p-2.5 rounded shadow-xl z-20 font-sans pointer-events-none leading-relaxed">
                    <strong className="text-white uppercase block mb-1">{metricConfigs.mse.fullName}</strong>
                    <p className="mb-1">{metricConfigs.mse.desc}</p>
                    <p className="text-emerald-400 mb-1"><strong>Range:</strong> {metricConfigs.mse.range}</p>
                    <p className="text-cyan-accent"><strong>Why it matters:</strong> {metricConfigs.mse.matters}</p>
                  </div>
                </div>
                <span className="text-sm font-heading font-black text-white">
                  {!hasGroundTruth || !metrics ? (
                    <span className="text-slate-600 text-[10px] font-mono font-normal">N/A</span>
                  ) : (
                    metrics.mse.toFixed(2)
                  )}
                </span>
              </div>

              {/* FSIM */}
              <div className="bg-space-navy-950 border border-space-navy-800 p-2.5 rounded group relative select-none">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[9px] font-mono text-slate-400 font-bold uppercase tracking-wider">
                    FSIM
                  </span>
                  <HelpCircle className="h-3 w-3 text-slate-500 hover:text-cyan-accent cursor-help" />
                  {/* Tooltip Popup */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 hidden group-hover:block bg-black/95 border border-space-navy-800 text-[9px] text-slate-300 p-2.5 rounded shadow-xl z-20 font-sans pointer-events-none leading-relaxed">
                    <strong className="text-white uppercase block mb-1">{metricConfigs.fsim.fullName}</strong>
                    <p className="mb-1">{metricConfigs.fsim.desc}</p>
                    <p className="text-emerald-400 mb-1"><strong>Range:</strong> {metricConfigs.fsim.range}</p>
                    <p className="text-cyan-accent"><strong>Why it matters:</strong> {metricConfigs.fsim.matters}</p>
                  </div>
                </div>
                <span className="text-sm font-heading font-black text-white">
                  {!hasGroundTruth || !metrics ? (
                    <span className="text-slate-600 text-[10px] font-mono font-normal">N/A</span>
                  ) : (
                    metrics.fsim.toFixed(4)
                  )}
                </span>
              </div>

            </div>

            {/* Pipeline Workflow Summary Card */}
            <div className="border-t border-space-navy-850 pt-3.5 mt-2 space-y-2">
              <span className="text-[8px] font-mono text-slate-500 uppercase tracking-widest block select-none">
                [ PIPELINE WORKFLOW ]
              </span>
              <div className="bg-space-navy-950 border border-space-navy-800 p-2 rounded flex items-center justify-between text-[7px] font-mono text-slate-400 uppercase select-none">
                <span>Input NC</span>
                <ChevronRight className="h-2 w-2 text-cyan-accent" />
                <span>Optical Flow</span>
                <ChevronRight className="h-2 w-2 text-cyan-accent" />
                <span>RIFE</span>
                <ChevronRight className="h-2 w-2 text-cyan-accent" />
                <span>Generated NC</span>
                <ChevronRight className="h-2 w-2 text-cyan-accent" />
                <span>Validation</span>
                <ChevronRight className="h-2 w-2 text-cyan-accent" />
                <span>Visual</span>
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* 3. VALIDATION SUMMARY (Bottom Panel) */}
      <section className="bg-space-navy-900 border border-space-navy-850 p-5 rounded-lg select-none">
        <div className="text-[9px] font-mono text-cyan-accent uppercase tracking-widest font-black border-b border-space-navy-850 pb-2 mb-4">
          [ DATASET VALIDATION SUMMARY ]
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-7 gap-4">
          
          <div className="bg-space-navy-950 border border-space-navy-800 p-3 rounded">
            <span className="text-[8px] font-mono text-slate-500 uppercase tracking-wider block mb-1">Generated Frames</span>
            <span className="text-base font-heading font-black text-white">{statsSummary.totalGenerated}</span>
          </div>

          <div className="bg-space-navy-950 border border-space-navy-800 p-3 rounded">
            <span className="text-[8px] font-mono text-slate-500 uppercase tracking-wider block mb-1">Validated Frames</span>
            <span className="text-base font-heading font-black text-cyan-accent">{statsSummary.totalValidated}</span>
          </div>

          {statsSummary.eligible ? (
            <>
              <div className="bg-space-navy-950 border border-space-navy-800 p-3 rounded">
                <span className="text-[8px] font-mono text-slate-500 uppercase tracking-wider block mb-1">Average SSIM</span>
                <span className="text-base font-heading font-black text-white">{statsSummary.avgSsim!.toFixed(4)}</span>
              </div>

              <div className="bg-space-navy-950 border border-space-navy-800 p-3 rounded">
                <span className="text-[8px] font-mono text-slate-500 uppercase tracking-wider block mb-1">Average PSNR</span>
                <span className="text-base font-heading font-black text-white">{statsSummary.avgPsnr!.toFixed(2)} dB</span>
              </div>

              <div className="bg-space-navy-950 border border-space-navy-800 p-3 rounded">
                <span className="text-[8px] font-mono text-slate-500 uppercase tracking-wider block mb-1">Average MSE</span>
                <span className="text-base font-heading font-black text-white">{statsSummary.avgMse!.toFixed(2)}</span>
              </div>

              <div className="bg-space-navy-950 border border-space-navy-800 p-3 rounded">
                <span className="text-[8px] font-mono text-slate-500 uppercase tracking-wider block mb-1">Average FSIM</span>
                <span className="text-base font-heading font-black text-white">{statsSummary.avgFsim!.toFixed(4)}</span>
              </div>

              <div className="bg-space-navy-950 border border-space-navy-800 p-3 rounded">
                <span className="text-[8px] font-mono text-slate-500 uppercase tracking-wider block mb-1">Avg Inference</span>
                <span className="text-base font-heading font-black text-slate-300">
                  {statsSummary.avgInf! === 0 ? "Cached" : `${statsSummary.avgInf!.toFixed(1)} ms`}
                </span>
              </div>
            </>
          ) : (
            <div className="md:col-span-2 lg:col-span-5 bg-space-navy-950/65 border border-dashed border-space-navy-800 p-3.5 rounded flex items-center justify-center text-[10px] font-mono text-slate-500 uppercase tracking-wider italic text-center leading-normal">
              Dataset summary requires additional validated observations.
            </div>
          )}

        </div>
      </section>

    </div>
  );
}
