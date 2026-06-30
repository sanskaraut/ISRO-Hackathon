"use client";

import React, { useRef, useEffect, useState } from "react";
import { ZoomIn, ZoomOut, Maximize2, Move } from "lucide-react";

import { getApiUrl } from "@/utils/api";

interface SatelliteViewerProps {
  activeTab: "ground-truth" | "ai-generated" | "difference";
  currentTime: string;
  cyclone: string;
  satellite: string;
  imageUrl: string | null;
  className?: string;
}

export default function SatelliteViewer({
  activeTab,
  currentTime,
  cyclone,
  satellite,
  imageUrl,
  className = ""
}: SatelliteViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const [zoom, setZoom] = useState(1.0);
  const [loadedUrl, setLoadedUrl] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [latLon, setLatLon] = useState({ lat: "20.59° N", lon: "88.27° E" });
  const [isHovered, setIsHovered] = useState(false);

  // Pre-load and cache image to prevent reloading on cursor hover/movement
  useEffect(() => {
    if (!imageUrl) {
      imgRef.current = null;
      setLoadedUrl(null);
      return;
    }

    const fullUrl = getApiUrl(imageUrl);
    if (fullUrl !== loadedUrl) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = fullUrl;
      img.onload = () => {
        imgRef.current = img;
        setLoadedUrl(fullUrl);
      };
      img.onerror = () => {
        console.error(`Failed to load image from: ${fullUrl}`);
        imgRef.current = null;
        setLoadedUrl(null);
      };
    }
  }, [imageUrl, loadedUrl]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setMousePos({ x, y });

    // Map pixel coordinates to Bay of Bengal regional coordinates (approximate)
    const baseLat = 22.5; // Top of canvas
    const baseLon = 84.0; // Left of canvas
    const latSpan = 5.0;  // Span top-to-bottom
    const lonSpan = 8.0;  // Span left-to-right

    const normX = x / canvas.width;
    const normY = y / canvas.height;

    const lat = (baseLat - normY * latSpan).toFixed(4);
    const lon = (baseLon + normX * lonSpan).toFixed(4);

    setLatLon({
      lat: `${lat}° N`,
      lon: `${lon}° E`,
    });
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set high-DPI scaling
    const rect = containerRef.current?.getBoundingClientRect();
    const width = rect?.width || 600;
    const height = rect?.height || 450;
    
    canvas.width = width * window.devicePixelRatio;
    canvas.height = height * window.devicePixelRatio;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    // 1. DRAW BACKGROUND
    ctx.fillStyle = "#02050a";
    ctx.fillRect(0, 0, width, height);

    // 2. DRAW COORDINATE GRID LINES
    ctx.strokeStyle = "rgba(58, 134, 255, 0.08)";
    ctx.lineWidth = 1;
    const gridSpacing = 80;

    for (let x = 0; x < width; x += gridSpacing) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += gridSpacing) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // 3. DRAW IMAGERY RENDER OR FALLBACK STANDBY
    if (imgRef.current) {
      ctx.save();
      const centerX = width / 2;
      const centerY = height / 2;
      ctx.translate(centerX, centerY);
      ctx.scale(zoom, zoom);
      
      // Draw centered image (our NetCDF crops are 1024x1024, draw scaled to fit the viewer)
      const drawSize = Math.min(width, height) - 40;
      ctx.drawImage(imgRef.current, -drawSize / 2, -drawSize / 2, drawSize, drawSize);
      ctx.restore();
    } else {
      ctx.fillStyle = "rgba(11, 19, 41, 0.6)";
      ctx.fillRect(20, 20, width - 40, height - 40);
      ctx.strokeStyle = "rgba(58, 134, 255, 0.2)";
      ctx.strokeRect(20, 20, width - 40, height - 40);
      
      ctx.fillStyle = "rgba(156, 163, 175, 0.7)";
      ctx.font = "12px monospace";
      ctx.textAlign = "center";
      
      if (imageUrl && !loadedUrl) {
        ctx.fillText("LOADING IMAGE FROM CONTAINER RESOURCE...", width / 2, height / 2);
      } else if (activeTab === "ground-truth" && (currentTime.includes("10") || currentTime.includes("20") || currentTime.includes("40") || currentTime.includes("50"))) {
        ctx.fillText("NO OBSERVATION DATA // AI INTERPOLATION MANDATORY", width / 2, height / 2);
      } else {
        ctx.fillText("STANDBY // AWAITING SYSTEM TELEMETRY COMMANDS", width / 2, height / 2);
      }
    }

    // 4. DRAW HUD OVERLAY INFO
    ctx.textAlign = "left";
    ctx.font = "10px JetBrains Mono, Courier, monospace";
    ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
    
    // Top-left satellite sensor telemetry
    ctx.fillText(`SAT: ${satellite}`, 15, 25);
    ctx.fillText(`BAND: TIR-1 (10.8 um)`, 15, 40);
    ctx.fillText(`RES: 4.0 km (Spatial)`, 15, 55);

    // Top-right coordinates and acquisition mode
    ctx.fillStyle = "rgba(0, 245, 212, 0.8)";
    ctx.fillText(`CENTER: 20.5900 N / 88.2700 E`, width - 240, 25);
    ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
    
    const isSynthesized = currentTime.includes("10") || currentTime.includes("20") || currentTime.includes("40") || currentTime.includes("50");
    ctx.fillText(`ACQUISITION: ${isSynthesized ? "AI SYNTHESIZED FRAME" : "RAW SENSOR IMAGE"}`, width - 240, 40);
    ctx.fillText(`TIME STEP: ${currentTime} UTC`, width - 240, 55);

    // DRAW GRID LABELS
    ctx.fillStyle = "rgba(58, 134, 255, 0.25)";
    ctx.font = "8px monospace";
    for (let x = 80; x < width; x += 80) {
      ctx.fillText(`${(84.0 + (x / width) * 8.0).toFixed(1)} E`, x + 5, height - 10);
    }
    for (let y = 80; y < height; y += 80) {
      ctx.fillText(`${(22.5 - (y / height) * 5.0).toFixed(1)} N`, 10, y - 5);
    }

    // DRAW SCALE BAR (Bottom Left)
    ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(15, height - 25);
    ctx.lineTo(115, height - 25);
    ctx.moveTo(15, height - 30);
    ctx.lineTo(15, height - 20);
    ctx.moveTo(115, height - 30);
    ctx.lineTo(115, height - 20);
    ctx.stroke();
    
    ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
    ctx.font = "9px monospace";
    ctx.fillText("100 km", 48, height - 32);

    // DRAW CROSSHAIR (If Hovered)
    if (isHovered) {
      ctx.strokeStyle = "rgba(0, 245, 212, 0.25)";
      ctx.lineWidth = 0.8;
      
      // Vertical line
      ctx.beginPath();
      ctx.moveTo(mousePos.x, 0);
      ctx.lineTo(mousePos.x, height);
      ctx.stroke();

      // Horizontal line
      ctx.beginPath();
      ctx.moveTo(0, mousePos.y);
      ctx.lineTo(width, mousePos.y);
      ctx.stroke();

      // Inner reticle circle
      ctx.beginPath();
      ctx.arc(mousePos.x, mousePos.y, 8, 0, Math.PI * 2);
      ctx.stroke();

      // Coordinates text at mouse
      ctx.fillStyle = "rgba(0, 245, 212, 0.9)";
      ctx.fillText(
        `${latLon.lat}, ${latLon.lon}`,
        mousePos.x + 12,
        mousePos.y - 12
      );
    }
  }, [loadedUrl, zoom, activeTab, currentTime, cyclone, satellite, isHovered, mousePos]);

  return (
    <div ref={containerRef} className="relative w-full h-[400px] border border-space-navy-800 bg-space-navy-950 overflow-hidden group select-none">
      
      {/* Canvas */}
      <canvas
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="cursor-crosshair block"
      />

      {/* Floating HUD controls */}
      <div className="absolute bottom-4 right-4 flex items-center space-x-1 bg-space-navy-900/80 border border-space-navy-800 p-1 rounded backdrop-blur z-20">
        <button
          onClick={() => setZoom(Math.min(3.0, zoom + 0.25))}
          className="p-1 text-slate-400 hover:text-cyan-accent hover:bg-space-navy-800 rounded transition-colors"
          title="Zoom In"
        >
          <ZoomIn className="h-4 w-4" />
        </button>
        <button
          onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}
          className="p-1 text-slate-400 hover:text-cyan-accent hover:bg-space-navy-800 rounded transition-colors"
          title="Zoom Out"
        >
          <ZoomOut className="h-4 w-4" />
        </button>
        <button
          onClick={() => setZoom(1.0)}
          className="p-1 text-xs font-mono text-slate-400 hover:text-cyan-accent hover:bg-space-navy-800 rounded px-1.5 transition-colors"
          title="Reset Zoom"
        >
          1:1
        </button>
      </div>

      {/* Map Grid Watermark */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 text-[9px] font-mono text-slate-600 tracking-widest pointer-events-none uppercase">
        {cyclone} // SATELLITE STAGING GRID
      </div>
    </div>
  );
}
