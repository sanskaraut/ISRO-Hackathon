"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ExternalLink, Satellite, Code2, Brain, Database, Play,
  Users, Award, Cpu, Target, Mail, Globe2, Sparkles, Terminal
} from "lucide-react";
import Badge from "@/components/ui/Badge";
import GlassCard from "@/components/cards/GlassCard";
import SectionContainer from "@/components/common/SectionContainer";
import Button from "@/components/ui/Button";
import Starfield from "@/components/common/Starfield";

// ─── GitHub SVG ───────────────────────────────────────────────────────────────
const GithubIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

// ─── Team data ────────────────────────────────────────────────────────────────
const TEAM = [
  {
    name: "Sanskar Raut",
    role: "Lead Developer",
    focus: "Full-Stack Development · System Integration · Deployments",
    github: "https://github.com/sanskaraut",
    color: "cyan" as const,
    icon: Code2,
    bio: "Engineered the Next.js frontend, designed the FastAPI dataset scanner & router backend, and integrated the Hugging Face GPU inference microservice into the core product workspace."
  },
  {
    name: "Rounak Sondawale",
    role: "ML Engineer",
    focus: "Model Architecture · RIFE Flow Estimation · Training",
    github: "https://github.com/sanskaraut",
    color: "blue" as const,
    icon: Brain,
    bio: "Developed the CNN-Attention-RIFE deep learning network, trained custom weights on historical cyclone databases, and optimized patch-based inference execution pipelines."
  },
  {
    name: "Raj Damle",
    role: "ML Engineer",
    focus: "Temporal Transformers · Cross-Attention Layers · Validation",
    github: "https://github.com/sanskaraut",
    color: "cyan" as const,
    icon: Database,
    bio: "Designed the multi-head cross-attention mechanism for temporal frame blending, implemented mathematical validation metrics (SSIM/PSNR), and curated raw NetCDF inputs."
  },
  {
    name: "Raj Kakade",
    role: "Creative Presentation & Design",
    focus: "UI Refinements · Presentation Design · Scientific Visualization",
    github: "https://github.com/sanskaraut",
    color: "blue" as const,
    icon: Target,
    bio: "Crafted key creative presentations for evaluators, directed UI aesthetic modifications, and optimized statistical telemetry representations to maximize presentation impact."
  }
];

const TECH_STACK = [
  { label: "PyTorch", desc: "Core deep learning framework for CNN-Attention-RIFE flow networks" },
  { label: "Temporal Transformers", desc: "Multi-head attention channels learning meteorological trajectory vectors" },
  { label: "RIFE Flow Net", desc: "Bi-directional optical flows estimating cloud motion displacement" },
  { label: "FastAPI", desc: "High-performance Python backend serving compressed NetCDF datasets" },
  { label: "Next.js 15", desc: "React framework with Tailwind/Vanilla CSS and Framer Motion visuals" },
  { label: "Hugging Face Spaces", desc: "Cloud GPU container hosting our dynamic model inference endpoints" },
  { label: "xarray / netCDF4", desc: "Robust handling of multidimensional satellite telemetry arrays" },
  { label: "GOES-19 / INSAT-3D", desc: "Standard weather satellite sensor data utilized for training" }
];

// Enhanced Scroll animations
const fadeInUp: any = {
  hidden: { opacity: 0, y: 35 },
  visible: (delay = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1], delay }
  })
};

const stagger: any = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.15 } }
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-space-navy-950 relative overflow-hidden">
      
      {/* Dynamic ambient backgrounds */}
      <div className="absolute top-10 left-10 w-96 h-96 rounded-full bg-electric-blue/5 blur-[120px] pointer-events-none" />
      <div className="absolute top-1/2 right-10 w-[500px] h-[500px] rounded-full bg-cyan-accent/5 blur-[150px] pointer-events-none" />

      {/* ─── HERO SECTION ────────────────────────────────────────────────── */}
      <section className="relative py-24 md:py-32 border-b border-space-navy-900 overflow-hidden">
        <Starfield />
        
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <motion.div initial="hidden" animate="visible" variants={stagger} className="space-y-6">
            <motion.div variants={fadeInUp}>
              <Badge variant="status" statusColor="cyan">ISRO HACKATHON 2026 // PROBLEM STATEMENT 12</Badge>
            </motion.div>

            <motion.div variants={fadeInUp} custom={0.1} className="flex items-center justify-center space-x-3">
              <div className="h-14 w-14 rounded-2xl border border-cyan-accent/30 bg-space-navy-900/80 flex items-center justify-center shadow-lg shadow-cyan-accent/5">
                <Users className="h-7 w-7 text-cyan-accent animate-pulse" />
              </div>
              <h1 className="font-heading text-4xl sm:text-6xl font-bold uppercase tracking-tight text-white leading-none">
                Meet the <span className="text-cyan-accent glow-text-cyan">Team</span>
              </h1>
            </motion.div>

            <motion.p variants={fadeInUp} custom={0.2}
              className="font-sans text-slate-300 text-base sm:text-lg max-w-3xl mx-auto leading-relaxed">
              We are a dedicated group of four developers and engineers building <strong className="text-white">CYC-INTEL</strong>,
              an advanced motion-aware deep learning framework that interpolates raw weather satellite observations
              to support high-frequency storm tracking.
            </motion.p>

            <motion.div variants={fadeInUp} custom={0.3} className="flex flex-wrap items-center justify-center gap-4">
              <a href="https://github.com/sanskaraut/ISRO-Hackathon" target="_blank" rel="noopener noreferrer">
                <Button variant="outline" icon={GithubIcon as any}>
                  Repository Code
                </Button>
              </a>
              <Link href="/demo">
                <Button variant="primary" icon={Play}>
                  Launch Interpolator
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ─── MISSION STATEMENT ────────────────────────────────────────────── */}
      <SectionContainer className="border-b border-space-navy-900 relative">
        <div className="max-w-5xl mx-auto space-y-12">
          
          <div className="text-center space-y-3">
            <Badge variant="status" statusColor="red">THE MISSION</Badge>
            <h2 className="font-heading text-2xl md:text-3xl font-bold uppercase text-white tracking-wider">
              Addressing the Temporal Resolution Gap
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <GlassCard techBorder glowOnHover className="space-y-4 p-6 transition-all duration-300 hover:-translate-y-1">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-space-navy-900 text-amber-400 border border-space-navy-800 shadow-md">
                <Satellite className="h-5.5 w-5.5" />
              </div>
              <h3 className="font-heading text-sm font-bold text-white uppercase tracking-wide">30-Min Silos</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-sans">
                Meteorological phenomena like eyewall replacement cycles evolve rapidly. Scans from INSAT-3D at 30-minute intervals miss high-frequency trajectory transitions.
              </p>
            </GlassCard>

            <GlassCard techBorder glowOnHover className="space-y-4 p-6 transition-all duration-300 hover:-translate-y-1">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-space-navy-900 text-cyan-accent border border-space-navy-800 shadow-md">
                <Brain className="h-5.5 w-5.5 animate-pulse" />
              </div>
              <h3 className="font-heading text-sm font-bold text-cyan-accent uppercase tracking-wide">Temporal Warp</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-sans">
                Our model maps complex physical velocities by calculating bi-directional flows, generating synthetic 10-minute and 20-minute observations with structural precision.
              </p>
            </GlassCard>

            <GlassCard techBorder glowOnHover className="space-y-4 p-6 transition-all duration-300 hover:-translate-y-1">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-space-navy-900 text-emerald-400 border border-space-navy-800 shadow-md">
                <Award className="h-5.5 w-5.5" />
              </div>
              <h3 className="font-heading text-sm font-bold text-white uppercase tracking-wide">Validated SSIM</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-sans">
                The model achieves <strong className="text-cyan-accent">SSIM = 0.9319</strong> on hold-out validation tests, enabling disaster teams to access GOES-grade tracking feeds instantly.
              </p>
            </GlassCard>
          </div>
        </div>
      </SectionContainer>

      {/* ─── DEVELOPERS LIST ─────────────────────────────────────────────── */}
      <SectionContainer className="border-b border-space-navy-900 relative bg-space-navy-950/20">
        <div className="max-w-5xl mx-auto space-y-12">
          
          <div className="text-center space-y-3">
            <Badge variant="status" statusColor="cyan">DEVELOPMENT COHORT</Badge>
            <h2 className="font-heading text-2xl md:text-3xl font-bold uppercase text-white tracking-wider font-bold">
              Team Roster
            </h2>
            <p className="font-sans text-sm text-slate-400 max-w-md mx-auto">
              Engineering students collaborating to solve high-frequency satellite image interpolation.
            </p>
          </div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            variants={stagger}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {TEAM.map((member, i) => {
              const Icon = member.icon;
              return (
                <motion.div 
                  key={member.name} 
                  variants={fadeInUp} 
                  custom={i * 0.1}
                  className="h-full"
                >
                  <GlassCard 
                    techBorder 
                    glowOnHover 
                    className="space-y-4 p-6 h-full flex flex-col justify-between transition-all duration-500 hover:shadow-[0_0_20px_rgba(0,245,212,0.04)]"
                  >
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`h-12 w-12 rounded-xl border flex items-center justify-center shrink-0 shadow-lg ${
                            member.color === "cyan"
                              ? "bg-cyan-accent/10 border-cyan-accent/30 text-cyan-accent"
                              : "bg-electric-blue/10 border-electric-blue/30 text-electric-blue"
                          }`}>
                            <Icon className="h-5.5 w-5.5" />
                          </div>
                          <div>
                            <h3 className={`font-heading text-sm font-bold uppercase tracking-wider ${
                              member.color === "cyan" ? "text-cyan-accent" : "text-electric-blue"
                            }`}>
                              {member.name}
                            </h3>
                            <p className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block font-bold">{member.role}</p>
                          </div>
                        </div>

                        <a
                          href={member.github}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="h-8 w-8 rounded-lg border border-space-navy-800 bg-space-navy-900/80 flex items-center justify-center text-slate-500 hover:text-white hover:border-slate-650 transition-all shrink-0 shadow"
                          title="View Profile"
                        >
                          <GithubIcon className="h-4.5 w-4.5" />
                        </a>
                      </div>

                      <p className="text-xs text-slate-400 leading-relaxed font-sans">{member.bio}</p>
                    </div>

                    <div className="bg-space-navy-950/80 border border-space-navy-850 rounded-xl px-3.5 py-2.5 mt-2">
                      <span className="text-[8px] font-mono text-slate-600 uppercase tracking-widest block mb-1">Focus Areas</span>
                      <span className="text-[10px] font-mono text-slate-300 font-bold">{member.focus}</span>
                    </div>
                  </GlassCard>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </SectionContainer>

      {/* ─── MODEL SPECS ─────────────────────────────────────────────────── */}
      <SectionContainer className="border-b border-space-navy-900 relative">
        <div className="max-w-5xl mx-auto space-y-12">
          
          <div className="text-center space-y-3">
            <Badge variant="status" statusColor="cyan">AI MODEL DESIGN</Badge>
            <h2 className="font-heading text-2xl md:text-3xl font-bold uppercase text-white tracking-wider">
              CNN-Attention-RIFE Pipeline
            </h2>
            <p className="font-sans text-sm text-slate-400 max-w-xl mx-auto leading-relaxed">
              Hybrid structural engineering that bridges physical optical flow calculations with temporal transformers to achieve crisp, realistic frame warping.
            </p>
          </div>

          {/* Architecture pipeline diagram */}
          <div className="bg-space-navy-900/40 border border-space-navy-900 rounded-2xl p-6 overflow-x-auto shadow-2xl">
            <div className="flex items-center space-x-3.5 min-w-[700px] py-2">
              {[
                { label: "Sparse Input (A & B)", sub: "NetCDF Grid arrays", color: "text-slate-400 border-space-navy-800" },
                { label: "CNN Encoder", sub: "5× Downsampling blocks\n96 feature channels", color: "text-electric-blue border-electric-blue/30", glow: true },
                { label: "Temporal Attention", sub: "Transformer sequence layers\n6 heads cross-attention", color: "text-cyan-accent border-cyan-accent/30", glow: true },
                { label: "Optical Flow Net", sub: "Estimates movement vectors\nbetween temporal steps", color: "text-cyan-accent border-cyan-accent/30", glow: true },
                { label: "Warp & fusion", sub: "Aligns features dynamically\nusing learned blend mask", color: "text-emerald-400 border-emerald-400/30", glow: true },
                { label: "Enhanced Output (t)", sub: "10-min resolution NetCDF", color: "text-slate-300 border-space-navy-800" }
              ].map((node, i, arr) => (
                <React.Fragment key={node.label}>
                  <div className={`flex flex-col items-center text-center p-3.5 rounded-xl border shrink-0 min-w-[120px] shadow-sm ${node.color} ${node.glow ? "bg-space-navy-950/80 border-opacity-70" : "bg-space-navy-950/30"}`}>
                    <span className="font-heading text-[11px] font-bold uppercase whitespace-pre-line leading-tight">{node.label}</span>
                    <span className="font-mono text-[8px] text-slate-500 mt-1.5 whitespace-pre-line leading-tight">{node.sub}</span>
                  </div>
                  {i < arr.length - 1 && (
                    <div className="text-cyan-accent/30 font-bold shrink-0 animate-pulse">→</div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Metric highlight */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "SSIM Target", value: "0.9319", sub: "hold-out test score", color: "text-cyan-accent border-cyan-accent/20 bg-cyan-accent/5" },
              { label: "Channel Dim", value: "96", sub: "feature depth", color: "text-white border-space-navy-850 bg-space-navy-900/30" },
              { label: "Transformer Heads", value: "6", sub: "cross-attention heads", color: "text-white border-space-navy-850 bg-space-navy-900/30" },
              { label: "Model Parameters", value: "best_model.pth", sub: "validation state", color: "text-white border-space-navy-850 bg-space-navy-900/30" }
            ].map((stat) => (
              <div key={stat.label} className={`border rounded-xl p-4 text-center shadow-md transition-all duration-300 hover:border-slate-650 ${stat.color}`}>
                <span className="text-[8px] font-mono uppercase tracking-widest block text-slate-500 mb-1">{stat.label}</span>
                <span className="text-xl font-heading font-black truncate block">{stat.value}</span>
                <span className="text-[9px] font-mono text-slate-500 block mt-1">{stat.sub}</span>
              </div>
            ))}
          </div>
        </div>
      </SectionContainer>

      {/* ─── TECH STACK ──────────────────────────────────────────────────── */}
      <SectionContainer className="border-b border-space-navy-900 relative">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <Badge variant="status" statusColor="cyan">PLATFORM SPECS</Badge>
            <h2 className="font-heading text-2xl font-bold uppercase text-white tracking-wider">
              Technology Stack
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {TECH_STACK.map((tech) => (
              <div key={tech.label}
                className="bg-space-navy-900/50 border border-space-navy-850 hover:border-cyan-accent/30 rounded-xl p-3.5 transition-colors group shadow-sm">
                <div className="flex items-center space-x-1.5 mb-1.5">
                  <div className="h-1.5 w-1.5 rounded-full bg-cyan-accent group-hover:shadow-[0_0_6px_#00f5d4] transition-all" />
                  <span className="font-heading text-[11px] font-bold text-white uppercase tracking-wide">{tech.label}</span>
                </div>
                <p className="text-[9px] font-sans text-slate-500 leading-relaxed">{tech.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </SectionContainer>

      {/* ─── PRESENTATION FOOTER CTA ─────────────────────────────────────── */}
      <SectionContainer>
        <div className="max-w-3xl mx-auto">
          <GlassCard techBorder className="text-center py-12 px-6 md:px-12 space-y-6 shadow-2xl">
            <div className="mx-auto h-12 w-12 rounded-full border border-cyan-accent/20 bg-space-navy-900 flex items-center justify-center text-cyan-accent shadow-inner">
              <Satellite className="h-6 w-6 animate-pulse" />
            </div>
            <h2 className="font-heading text-2xl font-bold text-white uppercase tracking-wider">
              Observe AI Interpolation live
            </h2>
            <p className="font-sans text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
              Examine the difference heatmaps, test custom files, and compare enhanced sequences in our interactive lab workspace.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
              <Link href="/demo">
                <Button variant="primary" size="lg" icon={Play}>
                  Start presenting
                </Button>
              </Link>
              <a href="https://github.com/sanskaraut/ISRO-Hackathon" target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="lg" icon={GithubIcon as any}>
                  GitHub Codebase
                </Button>
              </a>
            </div>
            <div className="pt-6 border-t border-space-navy-800 text-[10px] font-mono text-slate-600 uppercase tracking-widest">
              CYC-INTEL // ISRO HACKATHON // 2026
            </div>
          </GlassCard>
        </div>
      </SectionContainer>

    </div>
  );
}
