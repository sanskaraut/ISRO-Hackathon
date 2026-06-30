"use client";

import React, { useState } from "react";
import { Upload, Download, CheckCircle, Cpu, AlertTriangle, ArrowRight, Clock, ZoomIn } from "lucide-react";
import ImagePanel from "./ImagePanel";
import LoadingSequence from "./LoadingSequence";
import { getApiUrl } from "@/utils/api";

export default function UploadWorkspace() {
  const [fileA, setFileA] = useState<File | null>(null);
  const [fileB, setFileB] = useState<File | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Lightbox Zoom state
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [zoomedTitle, setZoomedTitle] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, target: "A" | "B") => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.name.endsWith(".nc")) {
        setError("Only NetCDF (.nc) files are supported.");
        return;
      }
      setError(null);
      if (target === "A") setFileA(file);
      else setFileB(file);
    }
  };

  const handleInterpolate = async () => {
    if (!fileA || !fileB) return;
    
    setIsGenerating(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append("file_a", fileA);
    formData.append("file_b", fileB);

    try {
      const response = await fetch(getApiUrl("/upload_generate"), {
        method: "POST",
        body: formData
      });

      if (!response.ok) {
        throw new Error("Backend custom interpolation failed.");
      }

      const data = await response.json();
      setResult(data);
      setIsGenerating(false);
    } catch (err: any) {
      console.error(err);
      setError("Failed to process NetCDF files. Ensure the backend FastAPI server is running.");
      setIsGenerating(false);
    }
  };

  const handleReset = () => {
    setFileA(null);
    setFileB(null);
    setResult(null);
    setError(null);
  };

  const triggerZoom = (url: string | null, title: string) => {
    if (!url) return;
    setZoomedImage(url);
    setZoomedTitle(title);
  };

  return (
    <div className="space-y-6">
      
      {/* 1. SELECTION & UPLOAD SECTION */}
      <section className="bg-space-navy-900 border border-space-navy-850 p-6 rounded-lg select-none">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          
          <div className="space-y-1 text-center md:text-left">
            <span className="text-[10px] font-mono text-cyan-accent uppercase tracking-widest font-bold">
              [ AD-HOC EXPERIMENTATION ]
            </span>
            <h2 className="font-heading text-lg font-bold text-white uppercase tracking-wider">
              Custom NetCDF Upload Workspace
            </h2>
            <p className="text-xs text-slate-400 max-w-md leading-relaxed">
              Upload two 5424 x 5424 full-disk or pre-cropped NetCDF telemetry files to run batch RIFE temporal flow synthesis in-memory.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleInterpolate}
              disabled={!fileA || !fileB || isGenerating}
              className="bg-cyan-accent hover:bg-cyan-400 disabled:bg-space-navy-950 text-space-navy-950 disabled:text-slate-600 border border-cyan-400/20 disabled:border-space-navy-850 px-5 py-2 rounded text-xs font-bold font-mono tracking-wide uppercase transition-all flex items-center space-x-2 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(0,245,212,0.15)] active:scale-95 cursor-pointer"
            >
              <Cpu className="h-4 w-4" />
              <span>Interpolate Uploads</span>
            </button>
            
            {(fileA || fileB || result) && (
              <button
                onClick={handleReset}
                disabled={isGenerating}
                className="bg-space-navy-950 hover:bg-space-navy-900 border border-space-navy-800 text-slate-300 px-4 py-2 rounded text-xs font-bold font-mono tracking-wide uppercase transition-all active:scale-95 cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

        </div>

        {/* Upload grids */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-6">
          
          {/* File A Upload */}
          <div className={`border-2 border-dashed rounded-lg p-5 flex flex-col items-center justify-center transition-all ${
            fileA 
              ? "border-emerald-500/40 bg-emerald-950/5" 
              : "border-space-navy-800 bg-space-navy-950/40 hover:border-slate-600"
          } relative overflow-hidden`}>
            <input
              type="file"
              accept=".nc"
              id="file-a-input"
              onChange={(e) => handleFileChange(e, "A")}
              className="absolute inset-0 opacity-0 cursor-pointer z-10"
              disabled={isGenerating}
            />
            <Upload className={`h-6 w-6 mb-3 ${fileA ? "text-emerald-400 animate-bounce" : "text-slate-500"}`} />
            <div className="text-center space-y-1">
              <span className="text-xs font-bold text-white block uppercase">
                {fileA ? fileA.name : "Select NetCDF File A (t=0)"}
              </span>
              <span className="text-[10px] font-mono text-slate-500 uppercase block">
                {fileA ? `${(fileA.size / 1024 / 1024).toFixed(1)} MB` : "DRAG & DROP OR CLICK TO BROWSE"}
              </span>
            </div>
          </div>

          {/* File B Upload */}
          <div className={`border-2 border-dashed rounded-lg p-5 flex flex-col items-center justify-center transition-all ${
            fileB 
              ? "border-emerald-500/40 bg-emerald-950/5" 
              : "border-space-navy-800 bg-space-navy-950/40 hover:border-slate-600"
          } relative overflow-hidden`}>
            <input
              type="file"
              accept=".nc"
              id="file-b-input"
              onChange={(e) => handleFileChange(e, "B")}
              className="absolute inset-0 opacity-0 cursor-pointer z-10"
              disabled={isGenerating}
            />
            <Upload className={`h-6 w-6 mb-3 ${fileB ? "text-emerald-400 animate-bounce" : "text-slate-500"}`} />
            <div className="text-center space-y-1">
              <span className="text-xs font-bold text-white block uppercase">
                {fileB ? fileB.name : "Select NetCDF File B (t=1)"}
              </span>
              <span className="text-[10px] font-mono text-slate-500 uppercase block">
                {fileB ? `${(fileB.size / 1024 / 1024).toFixed(1)} MB` : "DRAG & DROP OR CLICK TO BROWSE"}
              </span>
            </div>
          </div>

        </div>

        {error && (
          <div className="mt-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3 rounded text-xs font-mono flex items-center space-x-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </section>

      {/* 2. DYNAMIC WORKSPACE RENDER */}
      {(isGenerating || result) && (
        <div className="space-y-4">
          
          {/* Header Status */}
          {result && (
            <div className="bg-space-navy-900 border border-space-navy-850 px-6 py-3 rounded-lg flex flex-wrap items-center justify-between gap-4 select-none">
              <div className="flex items-center space-x-3">
                <div className="h-8 w-8 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-4.5 w-4.5 text-emerald-400" />
                </div>
                <div>
                  <h4 className="font-heading text-xs font-bold text-white uppercase tracking-wide">
                    ✓ Custom Synthesis Completed
                  </h4>
                  <p className="text-[9px] font-mono text-slate-500 uppercase">
                    Model outputs generated and indexed in virtual cache
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-6 text-xs font-mono">
                <div className="flex flex-col">
                  <span className="text-[8px] text-slate-500 uppercase font-black">Enhancement Ratio</span>
                  <span className="text-slate-300 font-bold">2 Inputs &rarr; Midpoint</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[8px] text-slate-500 uppercase font-black">Inference Duration</span>
                  <span className="text-cyan-accent font-black flex items-center space-x-1">
                    <Clock className="h-3 w-3 inline" />
                    <span>{(result.inference_time_ms / 1000).toFixed(2)} sec</span>
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[8px] text-slate-500 uppercase font-black">Discrepancy</span>
                  <span className="text-slate-300 font-bold">Self-Motion Estimate</span>
                </div>
              </div>
            </div>
          )}

          {/* 3-Panel Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            
            {/* Panel 1: Uploaded File A */}
            {isGenerating ? (
              <div className="w-full aspect-square md:aspect-[4/3] bg-space-navy-900 border border-space-navy-850 rounded-lg flex items-center justify-center">
                <div className="text-center space-y-2 font-mono text-[10px] text-slate-500 uppercase">
                  <div className="h-5 w-5 border-2 border-cyan-accent border-t-transparent rounded-full animate-spin mx-auto" />
                  <span>Loading Previews...</span>
                </div>
              </div>
            ) : (
              <ImagePanel
                title="Input File A"
                timestamp="t=0"
                image={result?.image_a_url}
                frameType="Uploaded Observation"
                onZoom={() => triggerZoom(result?.image_a_url, "Input File A (t=0)")}
                downloadUrl={result?.image_a_url ? getApiUrl(`/frame?satellite=CUSTOM&cyclone_id=UPLOAD&timestamp=${result.uid}_a&type=interpolated&format=nc`) : null}
              />
            )}

            {/* Panel 2: AI Synthesized Midpoint */}
            {isGenerating ? (
              <div className="w-full aspect-square md:aspect-[4/3] min-h-[300px]">
                <LoadingSequence />
              </div>
            ) : (
              <ImagePanel
                title="AI Synthesized Midpoint"
                timestamp="t=0.5"
                image={result?.image_url}
                frameType="AI Synthesized Frame"
                onZoom={() => triggerZoom(result?.image_url, "AI Synthesized Midpoint (t=0.5)")}
                downloadUrl={result?.download_url}
              />
            )}

            {/* Panel 3: Discrepancy Heatmap */}
            {isGenerating ? (
              <div className="w-full aspect-square md:aspect-[4/3] bg-space-navy-900 border border-space-navy-850 rounded-lg flex items-center justify-center">
                <div className="text-center space-y-2 font-mono text-[10px] text-slate-500 uppercase">
                  <div className="h-5 w-5 border-2 border-cyan-accent border-t-transparent rounded-full animate-spin mx-auto" />
                  <span>Loading Previews...</span>
                </div>
              </div>
            ) : (
              <ImagePanel
                title="Discrepancy Map"
                timestamp="t=0.5"
                image={result?.diff_url}
                frameType="Discrepancy Map"
                onZoom={() => triggerZoom(result?.diff_url, "Discrepancy Map (t=0.5)")}
                downloadUrl={result?.diff_url ? getApiUrl(`/frame?satellite=CUSTOM&cyclone_id=UPLOAD&timestamp=${result.uid}&type=difference&format=nc`) : null}
              />
            )}

          </div>

        </div>
      )}

      {/* 3. LIGHTBOX DIALOG */}
      {zoomedImage && (
        <div 
          onClick={() => setZoomedImage(null)}
          className="fixed inset-0 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-6 z-50 transition-all select-none animate-fadeIn"
        >
          <div className="bg-space-navy-950 border border-space-navy-800 rounded-lg max-w-4xl w-full max-h-[85vh] overflow-hidden flex flex-col relative">
            {/* Header */}
            <div className="px-4 py-3 bg-space-navy-900 border-b border-space-navy-850 flex items-center justify-between">
              <span className="font-heading text-xs font-bold text-white uppercase tracking-wide">
                {zoomedTitle}
              </span>
              <button 
                onClick={() => setZoomedImage(null)}
                className="text-xs font-mono text-slate-400 hover:text-white border border-space-navy-800 px-2 py-0.5 rounded cursor-pointer"
              >
                Close (ESC)
              </button>
            </div>
            {/* Image viewer */}
            <div className="grow overflow-auto p-4 flex items-center justify-center bg-black/20">
              <img 
                src={zoomedImage} 
                alt="Zoomed View" 
                className="max-w-full max-h-[70vh] object-contain rounded"
                draggable={false}
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
