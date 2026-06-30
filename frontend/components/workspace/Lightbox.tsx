"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, ZoomIn, ZoomOut, Move } from "lucide-react";
import { motion } from "framer-motion";

interface LightboxProps {
  isOpen: boolean;
  image: string | null;
  title: string;
  onClose: () => void;
}

export default function Lightbox({ isOpen, image, title, onClose }: LightboxProps) {
  const [zoom, setZoom] = useState(1.0);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Reset zoom and pan when lightbox opens/closes or when image changes
  useEffect(() => {
    setZoom(1.0);
    setPan({ x: 0, y: 0 });
    setIsDragging(false);
  }, [isOpen, image]);

  // Handle ESC key listener to close
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Prevent background page scrolling while wheel zooming inside the lightbox container
  useEffect(() => {
    const container = containerRef.current;
    if (!isOpen || !container) return;

    const preventDefault = (e: WheelEvent) => {
      e.preventDefault();
    };

    container.addEventListener("wheel", preventDefault, { passive: false });
    return () => container.removeEventListener("wheel", preventDefault);
  }, [isOpen]);

  if (!isOpen || !image) return null;

  // Handle wheel zoom
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    // Zoom step coefficient
    const zoomStep = 0.15;
    let newZoom = zoom + (e.deltaY < 0 ? zoomStep : -zoomStep);
    // Limit zoom level between 1.0x and 5.0x
    newZoom = Math.max(1.0, Math.min(5.0, newZoom));
    
    setZoom(newZoom);
    if (newZoom === 1.0) {
      setPan({ x: 0, y: 0 }); // reset pan if zoom is reset
    }
  };

  // Handle double click (toggle between 1.0x and 2.5x)
  const handleDoubleClick = () => {
    if (zoom > 1.0) {
      setZoom(1.0);
      setPan({ x: 0, y: 0 });
    } else {
      setZoom(2.5);
    }
  };

  // Drag-to-pan handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (zoom <= 1.0) return; // only pan when zoomed in
    setIsDragging(true);
    dragStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || zoom <= 1.0) return;
    setPan({
      x: e.clientX - dragStart.current.x,
      y: e.clientY - dragStart.current.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Backdrop click handler (closes if clicking exactly the outer wrapper)
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      ref={containerRef}
      onWheel={handleWheel}
      onClick={handleBackdropClick}
      className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-6 select-none cursor-default"
    >
      {/* Lightbox Dialog Window */}
      <div 
        className="max-w-4xl w-full h-[80vh] flex flex-col justify-between bg-space-navy-900 border border-space-navy-800 rounded-lg overflow-hidden shadow-2xl relative"
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Header */}
        <div className="bg-space-navy-950 border-b border-space-navy-850 px-4 py-3 flex items-center justify-between z-10">
          <div>
            <span className="text-[9px] font-mono text-cyan-accent uppercase block font-bold tracking-wider">
              High-Resolution Lightbox
            </span>
            <h3 className="font-heading text-xs font-bold text-white uppercase tracking-wider">
              {title}
            </h3>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Visual Zoom Level indicator */}
            <div className="text-[10px] font-mono text-slate-400 bg-space-navy-900 border border-space-navy-800 px-2 py-1 rounded flex items-center space-x-1.5">
              <span>Zoom:</span>
              <span className="text-cyan-accent font-bold">{zoom.toFixed(1)}x</span>
            </div>
            
            <button
              onClick={onClose}
              className="p-1.5 bg-space-navy-900 hover:bg-space-navy-800 border border-space-navy-850 text-slate-400 hover:text-white rounded transition-colors cursor-pointer"
              title="Close (ESC)"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Zoomable / Pannable Image Viewport */}
        <div
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onDoubleClick={handleDoubleClick}
          className={`grow bg-space-navy-950 flex items-center justify-center p-4 overflow-hidden relative ${
            zoom > 1.0 ? "cursor-grab active:cursor-grabbing" : ""
          }`}
        >
          {/* Background grid dots for perspective anchoring */}
          <div className="absolute inset-0 bg-[radial-gradient(rgba(0,245,212,0.015)_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
          
          <motion.div
            style={{
              x: pan.x,
              y: pan.y,
              scale: zoom
            }}
            transition={isDragging ? { duration: 0 } : { type: "spring", stiffness: 300, damping: 30 }}
            className="w-full h-full flex items-center justify-center pointer-events-none"
          >
            <img
              src={image}
              alt={title}
              className="max-w-full max-h-full object-contain pointer-events-auto"
              draggable={false}
            />
          </motion.div>

          {/* Inline Navigation Tip */}
          {zoom > 1.0 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-space-navy-950/85 backdrop-blur-sm border border-space-navy-800 px-3 py-1.5 rounded-full text-[9px] font-mono text-slate-400 flex items-center space-x-1.5 shadow-lg select-none pointer-events-none">
              <Move className="h-3 w-3 text-cyan-accent" />
              <span>Drag to Pan | Double-Click to Reset</span>
            </div>
          )}

          {zoom === 1.0 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-space-navy-950/70 border border-space-navy-900 px-3 py-1.5 rounded-full text-[9px] font-mono text-slate-500 flex items-center space-x-1.5 select-none pointer-events-none">
              <ZoomIn className="h-3 w-3" />
              <span>Scroll Wheel to Zoom | Double-Click to Magnify</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
