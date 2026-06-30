"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Terminal, Shield } from "lucide-react";

const Github = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

export default function Footer() {
  const [timeUtc, setTimeUtc] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeUtc(now.toISOString().replace("T", " ").substring(0, 19) + " UTC");
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <footer className="w-full border-t border-space-navy-800 bg-space-navy-950 py-8 relative overflow-hidden">
      {/* Background visual element */}
      <div className="absolute inset-0 bg-grid-pattern opacity-30 pointer-events-none"></div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand/Hackathon Metadata */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center space-x-2">
              <span className="font-heading text-sm font-semibold tracking-wider text-slate-100">
                CYC-INTEL // PLATFORM FOUNDATION
              </span>
            </div>
            <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
              Temporal interpolation of cyclone satellite imagery using deep learning models. 
              Developed for the ISRO Hackathon (Problem Statement: PS-12).
            </p>
            <div className="flex items-center space-x-4 pt-1">
              <span className="inline-flex items-center space-x-1.5 text-[10px] font-mono text-cyan-accent bg-cyan-accent/5 px-2 py-0.5 border border-cyan-accent/20 rounded">
                <span className="h-1 w-1 rounded-full bg-cyan-accent glow-dot-cyan"></span>
                <span>SYSTEM ONLINE</span>
              </span>
              <span className="text-[10px] font-mono text-slate-500">
                {timeUtc || "LOADING UTC CLOCK..."}
              </span>
            </div>
          </div>

          {/* Technical Stack */}
          <div>
            <h4 className="font-heading text-xs font-semibold uppercase tracking-wider text-slate-200 mb-3 flex items-center space-x-1.5">
              <Terminal className="h-3.5 w-3.5 text-electric-blue" />
              <span>Core Stack</span>
            </h4>
            <ul className="space-y-1.5 text-xs text-slate-400 font-mono">
              <li>Next.js 16 (App Router)</li>
              <li>Tailwind CSS v4</li>
              <li>FastAPI (Backend Gateway)</li>
              <li>PyTorch (Interpolation Model)</li>
            </ul>
          </div>

          {/* Project References & Info */}
          <div>
            <h4 className="font-heading text-xs font-semibold uppercase tracking-wider text-slate-200 mb-3 flex items-center space-x-1.5">
              <Shield className="h-3.5 w-3.5 text-emerald-500" />
              <span>Resources</span>
            </h4>
            <ul className="space-y-1.5 text-xs">
              <li>
                <Link href="/about" className="text-slate-400 hover:text-cyan-accent transition-colors duration-200">
                  Model Specifications
                </Link>
              </li>
              <li>
                <Link href="/explorer" className="text-slate-400 hover:text-cyan-accent transition-colors duration-200">
                  Satellite Imagery Info
                </Link>
              </li>
              <li className="flex items-center space-x-1">
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-400 hover:text-cyan-accent transition-colors duration-200 flex items-center gap-1"
                >
                  <Github className="h-3 w-3" />
                  <span>GitHub Repository</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-space-navy-800 my-6"></div>

        {/* Bottom copyright / disclaimer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] font-mono text-slate-500">
          <div>
            © {new Date().getFullYear()} CYC-INTEL. Built for ISRO Hackathon (PS-12).
          </div>
          <div className="flex space-x-4">
            <span>SATELLITE DATA SOURCE: INSAT-3D / 3DR</span>
            <span>MODEL: TEMPORAL GAN / FLOW-BASED INTERPOLATION</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
