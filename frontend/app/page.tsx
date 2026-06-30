"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Satellite,
  ArrowRight,
  Play,
  Compass,
  AlertTriangle,
  Sparkles,
  TrendingUp,
  Cpu,
  Video,
  Clock,
  Eye,
  Activity,
  Server,
  Database,
  LineChart,
  ChevronDown
} from "lucide-react";

import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import GlassCard from "@/components/cards/GlassCard";
import StatCard from "@/components/cards/StatCard";
import SectionContainer from "@/components/common/SectionContainer";
import AnimatedDivider from "@/components/common/AnimatedDivider";
import Starfield from "@/components/common/Starfield";
import GlobeWireframe from "@/components/common/GlobeWireframe";

// Animations presets for scroll reveal
const fadeInUp: any = {
  hidden: { opacity: 0, y: 30 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const, delay }
  })
};

const staggerContainer: any = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15
    }
  }
};

export default function LandingPage() {
  const scrollToNext = () => {
    const nextSection = document.getElementById("problem-section");
    if (nextSection) {
      nextSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="relative min-h-screen bg-space-navy-950 overflow-hidden select-none">
      {/* 1. HERO SECTION */}
      <section className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 md:py-20 border-b border-space-navy-900">
        <Starfield />
        
        {/* Ambient background glows */}
        <div className="absolute top-1/4 left-10 w-96 h-96 rounded-full bg-electric-blue/5 blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-1/4 right-10 w-[450px] h-[450px] rounded-full bg-cyan-accent/5 blur-[120px] pointer-events-none"></div>
        
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Hero Left Content */}
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="lg:col-span-7 space-y-6 text-left"
          >
            <motion.div variants={fadeInUp} custom={0}>
              <Badge variant="status" statusColor="cyan">
                ISRO HACKATHON // PS-12
              </Badge>
            </motion.div>
            
            <motion.h1 
              variants={fadeInUp} 
              custom={0.1}
              className="font-heading text-4xl sm:text-5xl xl:text-6xl font-bold uppercase tracking-tight text-white leading-tight"
            >
              Temporal <span className="text-cyan-accent glow-text-cyan">Interpolation</span> <br className="hidden sm:inline" />
              for Cyclone Imagery
            </motion.h1>
            
            <motion.p 
              variants={fadeInUp} 
              custom={0.2}
              className="font-sans text-slate-300 text-base sm:text-lg max-w-2xl leading-relaxed"
            >
              Synthesizing dense satellite sequence telemetry from sparse INSAT scans. Using motion-aware deep learning architectures to upsample temporal resolution from 30-minute intervals down to continuous 10-minute tracking datasets.
            </motion.p>
            
            <motion.div 
              variants={fadeInUp} 
              custom={0.3}
              className="flex flex-wrap items-center gap-4 pt-2"
            >
              <Link href="/demo">
                <Button variant="primary" icon={Play} size="lg">
                  Launch Live Demo
                </Button>
              </Link>
              <Link href="/explorer">
                <Button variant="outline" icon={Compass} size="lg">
                  Explore Cyclones
                </Button>
              </Link>
            </motion.div>

            {/* Platform Capabilities Mini Ticker */}
            <motion.div 
              variants={fadeInUp} 
              custom={0.4}
              className="pt-8 border-t border-space-navy-900 grid grid-cols-3 gap-4"
            >
              <div className="space-y-1">
                <span className="font-mono text-[9px] uppercase tracking-wider text-slate-500 block">MODEL BACKEND</span>
                <span className="font-heading text-sm font-semibold text-white uppercase">PyTorch Core</span>
              </div>
              <div className="space-y-1">
                <span className="font-mono text-[9px] uppercase tracking-wider text-slate-500 block">INGEST FEED</span>
                <span className="font-heading text-sm font-semibold text-white uppercase">INSAT-3D TIR</span>
              </div>
              <div className="space-y-1">
                <span className="font-mono text-[9px] uppercase tracking-wider text-slate-500 block">TARGET RATING</span>
                <span className="font-heading text-sm font-semibold text-white uppercase">10-Min Delta</span>
              </div>
            </motion.div>
          </motion.div>

          {/* Hero Right Visuals (Rotating Globe) */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="lg:col-span-5 flex justify-center"
          >
            <GlobeWireframe />
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center space-y-1.5 text-slate-500 hover:text-cyan-accent transition-colors duration-300">
          <span className="font-mono text-[9px] uppercase tracking-widest cursor-pointer" onClick={scrollToNext}>
            SCROLL TO DEPLOY
          </span>
          <motion.div
            animate={{ y: [0, 5, 0] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
          >
            <ChevronDown className="h-4 w-4 cursor-pointer" onClick={scrollToNext} />
          </motion.div>
        </div>
      </section>

      {/* 2. PROBLEM STATEMENT SECTION */}
      <SectionContainer id="problem-section" className="border-b border-space-navy-900 relative">
        <div className="absolute top-0 right-1/4 w-72 h-72 rounded-full bg-electric-blue/3 blur-[90px] pointer-events-none"></div>
        
        <div className="space-y-12 max-w-5xl mx-auto">
          {/* Header */}
          <div className="text-center space-y-3">
            <Badge variant="status" statusColor="red">
              THE INTEL GAP
            </Badge>
            <h2 className="font-heading text-2xl md:text-3xl font-bold uppercase text-white tracking-wider">
              The Temporal Resolution Constraint
            </h2>
            <p className="font-sans text-sm text-slate-400 max-w-xl mx-auto leading-relaxed">
              INSAT-3D raw weather imagery is captured at 30-minute intervals. Fast-moving meteorological features like cyclone eyewall rotations and core winds require sub-10-minute monitoring to map rapid changes.
            </p>
          </div>

          {/* Visual Flow diagram: Frame A -> Missing -> Frame B */}
          <div className="grid grid-cols-1 md:grid-cols-11 items-center gap-4 bg-space-navy-900/30 p-6 rounded-xl border border-space-navy-900">
            
            {/* Frame A */}
            <div className="md:col-span-3 flex flex-col items-center space-y-3 text-center">
              <span className="font-mono text-[10px] text-slate-400 font-bold uppercase bg-space-navy-900 border border-space-navy-800 px-2 py-0.5 rounded">
                FRAME A (t = 0 min)
              </span>
              <div className="w-full aspect-square max-w-[150px] relative rounded-lg border border-electric-blue/20 bg-space-navy-950 overflow-hidden flex items-center justify-center">
                {/* Simulated radar vortex */}
                <div className="absolute inset-2 border border-slate-800/40 rounded-full border-dashed"></div>
                <div className="absolute inset-6 border border-slate-800/60 rounded-full border-dashed"></div>
                {/* Spiral representation */}
                <svg viewBox="0 0 100 100" className="w-24 h-24 text-electric-blue/40 fill-transparent stroke-current animate-spin" style={{ animationDuration: "35s" }}>
                  <path d="M50 50 Q 65 30, 80 45 Q 60 70, 50 50" strokeWidth="2" />
                  <path d="M50 50 Q 35 70, 20 55 Q 40 30, 50 50" strokeWidth="2" />
                </svg>
                {/* Center crosshair */}
                <div className="absolute h-4 w-[1px] bg-slate-800"></div>
                <div className="absolute w-4 h-[1px] bg-slate-800"></div>
              </div>
              <span className="font-sans text-[11px] text-slate-400">
                INSAT Raw Input (09:00 UTC)
              </span>
            </div>

            {/* Gap Connector */}
            <div className="md:col-span-5 flex flex-col items-center justify-center py-4 space-y-2">
              <div className="flex items-center space-x-1.5 text-amber-500 font-mono text-[10px] font-bold uppercase tracking-wider bg-amber-500/5 px-2 py-1 rounded border border-amber-500/20">
                <AlertTriangle className="h-3.5 w-3.5" />
                <span>30 MINUTE DATA SILO</span>
              </div>
              
              {/* Connector SVG Line */}
              <svg viewBox="0 0 200 20" className="w-full max-w-[200px] h-6 text-slate-700">
                <line x1="10" y1="10" x2="190" y2="10" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" />
                <circle cx="10" cy="10" r="3" className="fill-electric-blue" />
                <circle cx="190" cy="10" r="3" className="fill-cyan-accent" />
                {/* Flashing alert center node */}
                <circle cx="100" cy="10" r="4" className="fill-amber-500 animate-ping" />
                <circle cx="100" cy="10" r="3" className="fill-amber-500" />
              </svg>
              
              <span className="font-sans text-[10px] text-slate-500 text-center max-w-[220px]">
                No physical sensor reads available in this window. Track velocity is unobserved.
              </span>
            </div>

            {/* Frame B */}
            <div className="md:col-span-3 flex flex-col items-center space-y-3 text-center">
              <span className="font-mono text-[10px] text-slate-400 font-bold uppercase bg-space-navy-900 border border-space-navy-800 px-2 py-0.5 rounded">
                FRAME B (t = 30 min)
              </span>
              <div className="w-full aspect-square max-w-[150px] relative rounded-lg border border-cyan-accent/20 bg-space-navy-950 overflow-hidden flex items-center justify-center">
                <div className="absolute inset-2 border border-slate-800/40 rounded-full border-dashed"></div>
                <div className="absolute inset-6 border border-slate-800/60 rounded-full border-dashed"></div>
                {/* Vortex slightly rotated compared to A */}
                <svg viewBox="0 0 100 100" className="w-24 h-24 text-cyan-accent/40 fill-transparent stroke-current rotate-45 animate-spin" style={{ animationDuration: "35s" }}>
                  <path d="M50 50 Q 65 30, 80 45 Q 60 70, 50 50" strokeWidth="2" />
                  <path d="M50 50 Q 35 70, 20 55 Q 40 30, 50 50" strokeWidth="2" />
                </svg>
                <div className="absolute h-4 w-[1px] bg-slate-800"></div>
                <div className="absolute w-4 h-[1px] bg-slate-800"></div>
              </div>
              <span className="font-sans text-[11px] text-slate-400">
                INSAT Raw Input (09:30 UTC)
              </span>
            </div>

          </div>

          <div className="text-center font-mono text-[10px] tracking-wider text-slate-500 uppercase">
            IMPLICIT TRACK FAILURE: Eye replacement cycles and rapid trajectory shifts remain hidden between frames.
          </div>
        </div>
      </SectionContainer>

      {/* 3. OUR AI SOLUTION */}
      <SectionContainer className="border-b border-space-navy-900 relative">
        <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none"></div>
        <div className="absolute bottom-0 left-10 w-80 h-80 rounded-full bg-cyan-accent/3 blur-[100px] pointer-events-none"></div>
        
        <div className="space-y-12 max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center space-y-3">
            <Badge variant="status" statusColor="cyan">
              THE SOLUTION
            </Badge>
            <h2 className="font-heading text-2xl md:text-3xl font-bold uppercase text-white tracking-wider">
              Deep Learning Frame Synthesis
            </h2>
            <p className="font-sans text-sm text-slate-400 max-w-xl mx-auto leading-relaxed">
              We train deep neural networks to learn temporal trajectories, warping the structures of Frame A to Frame B using bi-directional optical flows to generate accurate intermediate states.
            </p>
          </div>

          {/* Grid of Solution Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            
            {/* Card 1 */}
            <GlassCard hoverEffect delay={0} techBorder glowOnHover className="flex flex-col space-y-4">
              <div className="flex h-10 w-10 items-center justify-center rounded bg-space-navy-900 text-electric-blue border border-space-navy-800">
                <Database className="h-5 w-5" />
              </div>
              <h3 className="font-heading text-sm font-semibold text-white uppercase tracking-wide">
                1. Data Intake
              </h3>
              <p className="font-sans text-xs text-slate-400 leading-relaxed">
                Ingests raw INSAT-3D/3DR TIR infrared channel telemetry at 30-minute steps.
              </p>
            </GlassCard>

            {/* Card 2 */}
            <GlassCard hoverEffect delay={0.1} techBorder glowOnHover className="flex flex-col space-y-4">
              <div className="flex h-10 w-10 items-center justify-center rounded bg-space-navy-900 text-electric-blue border border-space-navy-800">
                <Server className="h-5 w-5" />
              </div>
              <h3 className="font-heading text-sm font-semibold text-white uppercase tracking-wide">
                2. Preprocess
              </h3>
              <p className="font-sans text-xs text-slate-400 leading-relaxed">
                Applies geographic alignment, noise filters, and eyewall coordinate anchoring.
              </p>
            </GlassCard>

            {/* Card 3 */}
            <GlassCard hoverEffect delay={0.2} techBorder glowOnHover className="flex flex-col space-y-4">
              <div className="flex h-10 w-10 items-center justify-center rounded bg-space-navy-900 text-cyan-accent border border-space-navy-800">
                <Cpu className="h-5 w-5" />
              </div>
              <h3 className="font-heading text-sm font-semibold text-white uppercase tracking-wide text-cyan-accent">
                3. Flow Network
              </h3>
              <p className="font-sans text-xs text-slate-400 leading-relaxed">
                Extracts dense spatial motion vectors to calculate accurate gas/cloud movement velocity.
              </p>
            </GlassCard>

            {/* Card 4 */}
            <GlassCard hoverEffect delay={0.3} techBorder glowOnHover className="flex flex-col space-y-4">
              <div className="flex h-10 w-10 items-center justify-center rounded bg-space-navy-900 text-cyan-accent border border-space-navy-800">
                <Video className="h-5 w-5 animate-pulse" />
              </div>
              <h3 className="font-heading text-sm font-semibold text-white uppercase tracking-wide text-cyan-accent">
                4. Interpolation
              </h3>
              <p className="font-sans text-xs text-slate-400 leading-relaxed">
                Generates synthetic frames at $t = 10$ and $t = 20$ minutes with complete structural fidelity.
              </p>
            </GlassCard>

            {/* Card 5 */}
            <GlassCard hoverEffect delay={0.4} techBorder glowOnHover className="flex flex-col space-y-4">
              <div className="flex h-10 w-10 items-center justify-center rounded bg-space-navy-900 text-success-emerald border border-space-navy-800">
                <LineChart className="h-5 w-5" />
              </div>
              <h3 className="font-heading text-sm font-semibold text-white uppercase tracking-wide">
                5. Visual Ops
              </h3>
              <p className="font-sans text-xs text-slate-400 leading-relaxed">
                Pipes the dense 10-minute telemetry loop to mission control operators for tracking.
              </p>
            </GlassCard>

          </div>
        </div>
      </SectionContainer>

      {/* 4. PROCESSING PIPELINE DIAGRAM */}
      <SectionContainer className="border-b border-space-navy-900 relative">
        <div className="absolute top-1/4 right-10 w-96 h-96 rounded-full bg-electric-blue/5 blur-[90px] pointer-events-none"></div>
        
        <div className="space-y-12 max-w-5xl mx-auto">
          {/* Header */}
          <div className="text-center space-y-3">
            <Badge variant="status" statusColor="cyan">
              OPERATIONAL TELEMETRY FLOW
            </Badge>
            <h2 className="font-heading text-2xl md:text-3xl font-bold uppercase text-white tracking-wider">
              Data Pipeline Pipeline
            </h2>
            <p className="font-sans text-sm text-slate-400 max-w-xl mx-auto leading-relaxed">
              Below is the operational data flow pathway mapping input sensor ingestion, deep interpolation, and visual upsampling.
            </p>
          </div>

          {/* SVG Pipeline Visualization */}
          <div className="glass-panel p-6 md:p-8 rounded-xl border border-space-navy-900 relative">
            
            {/* Top decorative grid */}
            <div className="absolute top-0 right-0 w-24 h-6 border-b border-l border-space-navy-800 font-mono text-[8px] flex items-center justify-center text-slate-500 tracking-widest">
              FLOW_INTEL: OK
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-center relative z-10">
              
              {/* Node 1 */}
              <div className="flex flex-col items-center text-center p-3 rounded border border-space-navy-800 bg-space-navy-950/60">
                <Satellite className="h-6 w-6 text-slate-400 mb-2" />
                <span className="font-mono text-[9px] text-slate-500 uppercase tracking-widest">INPUT SENSOR</span>
                <h4 className="font-heading text-xs font-semibold text-white uppercase mt-1">INSAT-3D Imager</h4>
                <span className="font-mono text-[9px] text-cyan-accent mt-1 bg-cyan-accent/5 px-1.5 py-0.5 rounded border border-cyan-accent/10">30m Interval</span>
              </div>

              {/* Path 1 */}
              <div className="hidden md:flex justify-center items-center">
                <svg viewBox="0 0 100 20" className="w-full text-cyan-accent/40">
                  <path d="M 0,10 L 100,10" className="stroke-current fill-transparent" strokeWidth="1" strokeDasharray="5 5" />
                  <circle cx="50" cy="10" r="3" className="fill-cyan-accent animate-ping" />
                  <circle cx="50" cy="10" r="2.5" className="fill-cyan-accent" />
                </svg>
              </div>

              {/* Node 2 */}
              <div className="flex flex-col items-center text-center p-3 rounded border border-cyan-accent/20 bg-space-navy-900/60 relative">
                <Cpu className="h-6 w-6 text-cyan-accent mb-2 animate-pulse" />
                <span className="font-mono text-[9px] text-slate-500 uppercase tracking-widest">AI INFERENCE</span>
                <h4 className="font-heading text-xs font-semibold text-cyan-accent uppercase mt-1">PyTorch Generator</h4>
                <span className="font-mono text-[9px] text-slate-400 mt-1">Flow Warp Layer</span>
                {/* Tech Glow Dot */}
                <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-cyan-accent glow-dot-cyan"></span>
              </div>

              {/* Path 2 */}
              <div className="hidden md:flex justify-center items-center">
                <svg viewBox="0 0 100 20" className="w-full text-electric-blue/40">
                  <path d="M 0,10 L 100,10" className="stroke-current fill-transparent" strokeWidth="1" strokeDasharray="5 5" />
                  <circle cx="50" cy="10" r="3" className="fill-electric-blue animate-ping" />
                  <circle cx="50" cy="10" r="2.5" className="fill-electric-blue" />
                </svg>
              </div>

              {/* Node 3 */}
              <div className="flex flex-col items-center text-center p-3 rounded border border-space-navy-800 bg-space-navy-950/60">
                <Clock className="h-6 w-6 text-slate-400 mb-2" />
                <span className="font-mono text-[9px] text-slate-500 uppercase tracking-widest">OUTPUT LOOP</span>
                <h4 className="font-heading text-xs font-semibold text-white uppercase mt-1">Dense Sequence</h4>
                <span className="font-mono text-[9px] text-success-emerald mt-1 bg-success-emerald/5 px-1.5 py-0.5 rounded border border-success-emerald/10">10m Synthetic</span>
              </div>

            </div>
          </div>
        </div>
      </SectionContainer>

      {/* 5. WHY THIS MATTERS */}
      <SectionContainer className="border-b border-space-navy-900 relative">
        <div className="absolute top-1/2 left-1/4 w-[500px] h-[500px] rounded-full bg-electric-blue/3 blur-[120px] pointer-events-none"></div>
        
        <div className="space-y-12 max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center space-y-3">
            <Badge variant="status" statusColor="cyan">
              ANALYSIS ADVANTAGES
            </Badge>
            <h2 className="font-heading text-2xl md:text-3xl font-bold uppercase text-white tracking-wider">
              Operational Advantages
            </h2>
            <p className="font-sans text-sm text-slate-400 max-w-xl mx-auto leading-relaxed">
              Elevating satellite tracking performance to matches advanced international standards, enabling high-frequency meteorology forecasts.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Feature 1 */}
            <GlassCard hoverEffect delay={0} glowOnHover className="space-y-4">
              <div className="flex h-10 w-10 items-center justify-center rounded bg-space-navy-900 text-electric-blue border border-space-navy-800">
                <Activity className="h-5 w-5" />
              </div>
              <h3 className="font-heading text-sm font-semibold text-white uppercase tracking-wide">
                Enhanced Cyclone Monitoring
              </h3>
              <p className="font-sans text-xs text-slate-400 leading-relaxed">
                Enables precision tracking of rapid eye formation, eyewall rotation velocity, and secondary eyewall replacement cycles between raw satellite scans.
              </p>
            </GlassCard>

            {/* Feature 2 */}
            <GlassCard hoverEffect delay={0.1} glowOnHover className="space-y-4">
              <div className="flex h-10 w-10 items-center justify-center rounded bg-space-navy-900 text-cyan-accent border border-space-navy-800">
                <Clock className="h-5 w-5 animate-pulse" />
              </div>
              <h3 className="font-heading text-sm font-semibold text-cyan-accent uppercase tracking-wide">
                Disaster Preparedness Feeds
              </h3>
              <p className="font-sans text-xs text-slate-400 leading-relaxed">
                Synthesizes high-frequency sequences mapping landfall schedules and coastal threats, providing rescue teams with sub-hourly visual updates.
              </p>
            </GlassCard>

            {/* Feature 3 */}
            <GlassCard hoverEffect delay={0.2} glowOnHover className="space-y-4">
              <div className="flex h-10 w-10 items-center justify-center rounded bg-space-navy-900 text-slate-300 border border-space-navy-800">
                <TrendingUp className="h-5 w-5" />
              </div>
              <h3 className="font-heading text-sm font-semibold text-white uppercase tracking-wide">
                Advanced GOES-Grade Feeds
              </h3>
              <p className="font-sans text-xs text-slate-400 leading-relaxed">
                Elevates older INSAT-3D sensors to deliver 10-minute temporal step sequences, comparable with advanced international GOES-16 and Himawari systems.
              </p>
            </GlassCard>

            {/* Feature 4 */}
            <GlassCard hoverEffect delay={0.3} glowOnHover className="space-y-4">
              <div className="flex h-10 w-10 items-center justify-center rounded bg-space-navy-900 text-slate-300 border border-space-navy-800">
                <Server className="h-5 w-5" />
              </div>
              <h3 className="font-heading text-sm font-semibold text-white uppercase tracking-wide">
                Missing Frame Reconstruction
              </h3>
              <p className="font-sans text-xs text-slate-400 leading-relaxed">
                Reconstructs sequences disrupted by ground station telemetry packet losses, sensor calibration dropouts, or satellite transmission noise.
              </p>
            </GlassCard>

            {/* Feature 5 */}
            <GlassCard hoverEffect delay={0.4} glowOnHover className="space-y-4 md:col-span-2">
              <div className="flex h-10 w-10 items-center justify-center rounded bg-space-navy-900 text-cyan-accent border border-space-navy-800">
                <Sparkles className="h-5 w-5" />
              </div>
              <h3 className="font-heading text-sm font-semibold text-cyan-accent uppercase tracking-wide">
                Fluid Dynamic-Aware Interpolation
              </h3>
              <p className="font-sans text-xs text-slate-400 leading-relaxed">
                Constrains vector generations using meteorological fluid mechanics coefficients, ensuring that synthesized visual frames align with real physics.
              </p>
            </GlassCard>

          </div>
        </div>
      </SectionContainer>

      {/* 6. CALL TO ACTION */}
      <SectionContainer className="relative">
        <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-cyan-accent/3 blur-[140px] pointer-events-none"></div>
        
        <div className="max-w-4xl mx-auto z-10 relative">
          <GlassCard techBorder className="text-center py-12 px-6 md:px-12 space-y-6">
            <div className="mx-auto h-12 w-12 rounded-full border border-cyan-accent/20 bg-space-navy-900 flex items-center justify-center text-cyan-accent glow-dot-cyan">
              <Satellite className="h-6 w-6 animate-pulse" />
            </div>
            
            <h2 className="font-heading text-2xl md:text-3xl font-bold text-white uppercase tracking-wider">
              Launch Interpolation Workspace
            </h2>
            
            <p className="font-sans text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
              Explore dynamic storm sequences or process INSAT raw datasets on the staging container. Check interpolation results and view visual telemetry readouts instantly.
            </p>
            
            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
              <Link href="/demo">
                <Button variant="primary" size="lg" icon={Play}>
                  Launch Lab Demo
                </Button>
              </Link>
              <Link href="/explorer">
                <Button variant="outline" size="lg" icon={Compass}>
                  Explore Datasets
                </Button>
              </Link>
            </div>
            
            <div className="pt-6 border-t border-space-navy-800 text-[10px] font-mono text-slate-500 uppercase tracking-widest">
              PLATFORM VER: 1.0.0-BETA // NODE STATUS: ONLINE
            </div>
          </GlassCard>
        </div>
      </SectionContainer>
    </div>
  );
}
