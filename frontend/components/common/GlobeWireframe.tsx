"use client";

import React from "react";
import { motion } from "framer-motion";

export default function GlobeWireframe() {
  return (
    <div className="relative w-full max-w-[420px] aspect-square mx-auto flex items-center justify-center">
      {/* Glow Behind the Globe */}
      <div className="absolute inset-0 rounded-full bg-electric-blue/10 blur-[60px] animate-pulse-slow"></div>

      {/* SVG Canvas */}
      <svg
        viewBox="0 0 400 400"
        className="w-full h-full text-cyan-accent/30 select-none pointer-events-none"
      >
        {/* Outer Ring */}
        <circle
          cx="200"
          cy="200"
          r="160"
          className="stroke-cyan-accent/20 fill-transparent"
          strokeWidth="1"
          strokeDasharray="4 4"
        />

        {/* Outer Coordinate Ticks */}
        <circle
          cx="200"
          cy="200"
          r="150"
          className="stroke-electric-blue/30 fill-transparent"
          strokeWidth="2"
        />

        {/* Rotating Globe Body */}
        <g className="animate-spin" style={{ animationDuration: "60s" }}>
          {/* Base Globe Sphere */}
          <circle
            cx="200"
            cy="200"
            r="120"
            className="stroke-cyan-accent/40 fill-space-navy-900/40"
            strokeWidth="1.5"
          />

          {/* Longitude Ellipse 1 */}
          <ellipse
            cx="200"
            cy="200"
            rx="90"
            ry="120"
            className="stroke-cyan-accent/30 fill-transparent"
            strokeWidth="1"
          />

          {/* Longitude Ellipse 2 */}
          <ellipse
            cx="200"
            cy="200"
            rx="50"
            ry="120"
            className="stroke-cyan-accent/25 fill-transparent"
            strokeWidth="1"
          />

          {/* Center Longitude Line */}
          <line
            x1="200"
            y1="80"
            x2="200"
            y2="320"
            className="stroke-cyan-accent/20"
            strokeWidth="1.5"
          />

          {/* Latitude Ellipse 1 (Equator) */}
          <ellipse
            cx="200"
            cy="200"
            rx="120"
            ry="40"
            className="stroke-cyan-accent/30 fill-transparent"
            strokeWidth="1"
          />

          {/* Latitude Ellipse 2 */}
          <ellipse
            cx="200"
            cy="200"
            rx="120"
            ry="80"
            className="stroke-cyan-accent/25 fill-transparent"
            strokeWidth="1"
          />

          {/* Center Latitude Line */}
          <line
            x1="80"
            y1="200"
            x2="320"
            y2="200"
            className="stroke-cyan-accent/20"
            strokeWidth="1.5"
          />
        </g>

        {/* Orbit Path for Satellite */}
        <ellipse
          cx="200"
          cy="200"
          rx="180"
          ry="70"
          className="stroke-electric-blue/30 fill-transparent"
          strokeWidth="1"
          transform="rotate(-25 200 200)"
          strokeDasharray="6 3"
        />

        {/* Orbiting Satellite Node */}
        {/* We can animate this orbit path by rendering a motion group */}
        <g transform="rotate(-25 200 200)">
          <circle cx="200" cy="200" r="180" className="fill-transparent stroke-transparent" id="orbit-ref">
            {/* Invisible path anchor */}
          </circle>
          {/* Real simulated satellite */}
          <motion.g
            animate={{
              x: [180 * Math.cos(0), 180 * Math.cos(Math.PI/2), 180 * Math.cos(Math.PI), 180 * Math.cos(3*Math.PI/2), 180 * Math.cos(2*Math.PI)],
              y: [70 * Math.sin(0), 70 * Math.sin(Math.PI/2), 70 * Math.sin(Math.PI), 70 * Math.sin(3*Math.PI/2), 70 * Math.sin(2*Math.PI)],
            }}
            transition={{
              repeat: Infinity,
              duration: 15,
              ease: "linear",
            }}
            style={{ originX: 0, originY: 0 }}
          >
            <g transform="translate(200, 200)">
              {/* Satellite Graphic */}
              <rect x="-6" y="-6" width="12" height="12" className="fill-cyan-accent stroke-cyan-accent" strokeWidth="1" />
              <line x1="-12" y1="0" x2="12" y2="0" className="stroke-cyan-accent" strokeWidth="1" />
              <circle cx="0" cy="0" r="3" className="fill-space-navy-950" />
              {/* Satellite Pulse/Glow */}
              <circle cx="0" cy="0" r="8" className="stroke-cyan-accent/50 fill-transparent animate-ping" />
            </g>
          </motion.g>
        </g>

        {/* HUD Overlay Elements */}
        {/* Top Left Angle Bracket */}
        <path d="M 50,70 L 50,50 L 70,50" className="stroke-cyan-accent fill-transparent" strokeWidth="1.5" />
        <text x="80" y="62" className="fill-cyan-accent/80 font-mono text-[9px] tracking-widest">SAT_INSAT_3D</text>

        {/* Bottom Right Angle Bracket */}
        <path d="M 330,350 L 350,350 L 350,330" className="stroke-cyan-accent fill-transparent" strokeWidth="1.5" />
        <text x="245" y="347" className="fill-cyan-accent/80 font-mono text-[9px] tracking-widest">ALT: 35,786 KM</text>

        {/* Angle Ticks */}
        <line x1="200" y1="30" x2="200" y2="40" className="stroke-cyan-accent/60" strokeWidth="1" />
        <line x1="200" y1="360" x2="200" y2="370" className="stroke-cyan-accent/60" strokeWidth="1" />
        <line x1="30" y1="200" x2="40" y2="200" className="stroke-cyan-accent/60" strokeWidth="1" />
        <line x1="360" y1="200" x2="370" y2="200" className="stroke-cyan-accent/60" strokeWidth="1" />
      </svg>
    </div>
  );
}
