"use client";

import React from "react";
import { ZoomIn, HelpCircle, Download } from "lucide-react";
import { motion } from "framer-motion";
import { getApiUrl } from "@/utils/api";

interface ImagePanelProps {
  title: string;
  timestamp: string;
  image: string | null;
  frameType: string;
  loading?: boolean;
  onZoom?: () => void;
  emptyState?: boolean;
  emptyContext?: {
    frameA?: string;
    frameB?: string;
    title?: string;
    message?: string;
  };
  activeSource?: "ai" | "raw";
  onSourceChange?: (source: "ai" | "raw") => void;
  downloadUrl?: string | null;
}

export default function ImagePanel({
  title,
  timestamp,
  image,
  frameType,
  loading = false,
  onZoom,
  emptyState = false,
  emptyContext,
  activeSource,
  onSourceChange,
  downloadUrl
}: ImagePanelProps) {
  return (
    <div className="bg-space-navy-900 border border-space-navy-850 rounded-lg flex flex-col justify-between overflow-hidden relative group aspect-square md:aspect-[4/3] w-full min-h-[300px]">
      
      {/* Panel Header */}
      <div className="bg-space-navy-950/80 border-b border-space-navy-850 px-4 py-2 flex items-center justify-between z-10 shrink-0 select-none">
        <div>
          <span className="text-[10px] font-mono text-slate-500 uppercase block tracking-wider">
            {frameType}
          </span>
          <h3 className="font-heading text-xs font-bold text-white uppercase tracking-wide">
            {title}
          </h3>
        </div>

        {activeSource && onSourceChange && (
          <div className="flex bg-space-navy-950 border border-space-navy-850 p-0.5 rounded text-[8px] font-mono select-none">
            <button
              onClick={() => onSourceChange("ai")}
              className={`px-1.5 py-0.5 rounded font-bold transition-all ${
                activeSource === "ai"
                  ? "bg-cyan-accent text-space-navy-950 shadow-[0_0_8px_rgba(0,245,212,0.4)]"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              AI Midpoint
            </button>
            <button
              onClick={() => onSourceChange("raw")}
              className={`px-1.5 py-0.5 rounded font-bold transition-all ${
                activeSource === "raw"
                  ? "bg-slate-700 text-white"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Original
            </button>
          </div>
        )}

        <div className="text-right">
          <span className="text-[10px] font-mono text-cyan-accent uppercase block font-bold">
            Timestamp
          </span>
          <span className="text-xs font-mono text-slate-300 font-bold">
            {timestamp || "--:--"} UTC
          </span>
        </div>
      </div>

      {/* Image / State Content Area */}
      <div className="grow relative flex items-center justify-center bg-space-navy-950/20 overflow-hidden">
        {emptyState ? (
          /* Empty State prior to generation */
          <div className="p-6 text-center space-y-6 flex flex-col items-center justify-center w-full h-full select-none">
            {/* Scientific structural diagram: [A] ➔ [?] ➔ [B] */}
            <div className="flex items-center justify-center space-x-3 md:space-x-4">
              <div className="px-3 py-1.5 bg-space-navy-900 border border-space-navy-800 rounded text-[10px] font-mono text-slate-400">
                {emptyContext?.frameA || "A"}
              </div>
              <span className="text-slate-600 text-xs font-bold">&rarr;</span>
              <div className="h-10 w-10 bg-cyan-accent/5 border border-dashed border-cyan-accent/30 rounded-full flex items-center justify-center">
                <HelpCircle className="h-5 w-5 text-cyan-accent/40" />
              </div>
              <span className="text-slate-600 text-xs font-bold">&rarr;</span>
              <div className="px-3 py-1.5 bg-space-navy-900 border border-space-navy-800 rounded text-[10px] font-mono text-slate-400">
                {emptyContext?.frameB || "B"}
              </div>
            </div>

            <div className="space-y-1.5 max-w-[240px]">
              <span className="text-[9px] font-mono text-cyan-accent uppercase tracking-widest block font-bold">
                {emptyContext?.title || "Awaiting Target"}
              </span>
              <p className="text-[11px] font-mono text-slate-500 leading-normal">
                {emptyContext?.message || "Select two frames from the timeline to generate the intermediate observation."}
              </p>
            </div>
          </div>
        ) : loading ? (
          /* Loading indicator */
          <div className="text-center space-y-2 select-none">
            <div className="h-5 w-5 border-2 border-cyan-accent border-t-transparent rounded-full animate-spin mx-auto" />
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block">
              Inference Active
            </span>
          </div>
        ) : image ? (
          /* Success State - Renders the image */
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="w-full h-full relative"
          >
            {/* Dark background grid lines to anchor the imagery */}
            <div className="absolute inset-0 bg-[radial-gradient(rgba(58,134,255,0.02)_1px,transparent_1px)] [background-size:12px_12px] pointer-events-none" />
            
            <img
              src={getApiUrl(image)}
              alt={title}
              onClick={onZoom}
              className="w-full h-full object-contain object-center cursor-pointer hover:opacity-90 transition-opacity"
              draggable={false}
              title="Click to Zoom"
            />

             {/* Action Buttons (Bottom Right) */}
            <div className="absolute bottom-3 right-3 flex items-center space-x-2 z-10">
              {downloadUrl && (
                <a
                  href={getApiUrl(downloadUrl)}
                  download
                  className="bg-space-navy-950/85 hover:bg-space-navy-900 border border-space-navy-800 hover:border-slate-600 p-2 rounded text-slate-400 hover:text-white transition-all cursor-pointer hover:shadow-lg flex items-center justify-center"
                  title="Download .nc NetCDF File"
                >
                  <Download className="h-4 w-4" />
                </a>
              )}
              {onZoom && (
                <button
                  onClick={onZoom}
                  className="bg-space-navy-950/85 hover:bg-space-navy-900 border border-space-navy-800 hover:border-slate-600 p-2 rounded text-slate-400 hover:text-white transition-all cursor-pointer hover:shadow-lg flex items-center justify-center"
                  title="Zoom Panel"
                >
                  <ZoomIn className="h-4 w-4" />
                </button>
              )}
            </div>
          </motion.div>
        ) : (
          /* Standby State (e.g. frames missing) */
          <div className="text-center text-[10px] font-mono text-slate-600 select-none">
            No telemetry loaded
          </div>
        )}
      </div>

    </div>
  );
}
