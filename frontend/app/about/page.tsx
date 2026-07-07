"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ExternalLink, Satellite, Code2, Brain, Database, Play,
  Users, Award, Cpu, Target, Mail, Globe2
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
    name: "Sanskar Aut",
    role: "ML Engineer & Team Lead",
    focus: "Model Architecture · Training Pipeline · HF Space Deployment",
    github: "https://github.com/sanskaraut",
    color: "cyan" as const,
    icon: Brain,
    bio: "Designed and trained the CNN-Attention-RIFE temporal interpolation model. Built the HF Space inference microservice and coordinated the end-to-end ML pipeline."
  },
  {
    name: "Team Member 2",
    role: "Backend Engineer",
    focus: "FastAPI Backend · Data Pipeline · NetCDF Processing",
    github: "https://github.com/sanskaraut",
    color: "blue" as const,
    icon: Database,
    bio: "Built the FastAPI backend serving cyclone datasets, implemented the NetCDF processing pipeline, and designed the REST API powering the demo workspace."
  },
  {
    name: "Team Member 3",
    role: "Frontend Engineer",
    focus: "Next.js UI · Visualization · UX Design",
    github: "https://github.com/sanskaraut",
    color: "cyan" as const,
    icon: Code2,
    bio: "Designed and implemented the interactive CYC-INTEL web application, including the scientific comparison workspace, timeline, and satellite image panels."
  },
  {
    name: "Team Member 4",
    role: "Data & Research",
    focus: "Dataset Curation · Evaluation Metrics · Analysis",
    github: "https://github.com/sanskaraut",
    color: "blue" as const,
    icon: Target,
    bio: "Curated INSAT-3D and GOES-19 satellite datasets, established the SSIM/PSNR/MSE/FSIM evaluation framework, and validated interpolation quality."
  }
];

const TECH_STACK = [
  { label: "PyTorch", desc: "Deep learning framework for the interpolation model" },
  { label: "CNN + Attention", desc: "Hybrid CNN encoder with temporal transformer cross-attention" },
  { label: "RIFE Flow Net", desc: "Bi-directional optical flow estimation for motion-aware warping" },
  { label: "FastAPI", desc: "High-performance Python backend serving NetCDF datasets" },
  { label: "Next.js 15", desc: "React-based web frontend with server components" },
  { label: "Hugging Face Spaces", desc: "Cloud GPU inference microservice hosting" },
  { label: "xarray / NetCDF4", desc: "Satellite data ingestion and processing" },
  { label: "GOES-19 / INSAT-3D", desc: "Primary satellite data sources" }
];

const fadeInUp: any = {
  hidden: { opacity: 0, y: 24 },
  visible: (delay = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1], delay }
  })
};

const stagger: any = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-space-navy-950">

      {/* ─── HERO ──────────────────────────────────────────────────────────── */}
      <section className="relative py-20 md:py-28 border-b border-space-navy-900 overflow-hidden">
        <Starfield />
        <div className="absolute top-1/4 left-10 w-96 h-96 rounded-full bg-electric-blue/5 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-10 w-80 h-80 rounded-full bg-cyan-accent/5 blur-[100px] pointer-events-none" />

        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <motion.div initial="hidden" animate="visible" variants={stagger} className="space-y-6">
            <motion.div variants={fadeInUp}>
              <Badge variant="status" statusColor="cyan">ISRO HACKATHON 2026 // PS-12</Badge>
            </motion.div>

            <motion.div variants={fadeInUp} custom={0.1} className="flex items-center justify-center space-x-3">
              <div className="h-12 w-12 rounded-xl border border-cyan-accent/30 bg-space-navy-900 flex items-center justify-center">
                <Users className="h-6 w-6 text-cyan-accent" />
              </div>
              <h1 className="font-heading text-4xl sm:text-5xl font-bold uppercase tracking-tight text-white">
                About <span className="text-cyan-accent glow-text-cyan">Us</span>
              </h1>
            </motion.div>

            <motion.p variants={fadeInUp} custom={0.2}
              className="font-sans text-slate-300 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
              We are a team of 4 engineering students building <strong className="text-white">CYC-INTEL</strong> —
              a deep learning system that synthesizes missing satellite frames to enhance cyclone tracking resolution
              from 30-minute to 10-minute intervals.
            </motion.p>

            <motion.div variants={fadeInUp} custom={0.3} className="flex flex-wrap items-center justify-center gap-3">
              <a href="https://github.com/sanskaraut/ISRO-Hackathon" target="_blank" rel="noopener noreferrer">
                <Button variant="outline" icon={GithubIcon as any}>
                  View on GitHub
                </Button>
              </a>
              <Link href="/demo">
                <Button variant="primary" icon={Play}>
                  Try the Demo
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ─── PROJECT CONTEXT ──────────────────────────────────────────────── */}
      <SectionContainer className="border-b border-space-navy-900">
        <div className="max-w-5xl mx-auto space-y-10">
          <div className="text-center space-y-3">
            <Badge variant="status" statusColor="red">THE PROBLEM</Badge>
            <h2 className="font-heading text-2xl md:text-3xl font-bold uppercase text-white tracking-wider">
              ISRO PS-12 Problem Statement
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <GlassCard techBorder glowOnHover className="space-y-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-space-navy-900 text-amber-400 border border-space-navy-800">
                <Satellite className="h-5 w-5" />
              </div>
              <h3 className="font-heading text-sm font-bold text-white uppercase tracking-wide">The Gap</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-sans">
                INSAT-3D scans the Indian subcontinent every <strong className="text-white">30 minutes</strong>. 
                Fast-moving cyclone features like eyewall replacement cycles can develop and dissipate 
                within that window — unobserved.
              </p>
            </GlassCard>

            <GlassCard techBorder glowOnHover className="space-y-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-space-navy-900 text-cyan-accent border border-space-navy-800">
                <Brain className="h-5 w-5" />
              </div>
              <h3 className="font-heading text-sm font-bold text-cyan-accent uppercase tracking-wide">Our Approach</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-sans">
                Train a deep neural network to learn temporal motion between two satellite frames and 
                synthesize realistic <strong className="text-white">intermediate observations</strong> at 
                t = 10 min and t = 20 min positions.
              </p>
            </GlassCard>

            <GlassCard techBorder glowOnHover className="space-y-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-space-navy-900 text-emerald-400 border border-space-navy-800">
                <Award className="h-5 w-5" />
              </div>
              <h3 className="font-heading text-sm font-bold text-white uppercase tracking-wide">Result</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-sans">
                Achieved <strong className="text-cyan-accent">SSIM = 0.9319</strong> on hold-out validation data 
                (epoch 9). Dense 10-minute sequences comparable to international GOES-16 / Himawari-8 standards.
              </p>
            </GlassCard>
          </div>
        </div>
      </SectionContainer>

      {/* ─── TEAM ─────────────────────────────────────────────────────────── */}
      <SectionContainer className="border-b border-space-navy-900">
        <div className="max-w-5xl mx-auto space-y-10">
          <div className="text-center space-y-3">
            <Badge variant="status" statusColor="cyan">THE TEAM</Badge>
            <h2 className="font-heading text-2xl md:text-3xl font-bold uppercase text-white tracking-wider">
              Meet the Developers
            </h2>
            <p className="font-sans text-sm text-slate-400 max-w-lg mx-auto">
              Built for ISRO Hackathon 2026 — Problem Statement 12: Temporal Interpolation of Satellite Imagery.
            </p>
          </div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
            className="grid grid-cols-1 md:grid-cols-2 gap-5"
          >
            {TEAM.map((member, i) => {
              const Icon = member.icon;
              return (
                <motion.div key={member.name} variants={fadeInUp} custom={i * 0.1}>
                  <GlassCard techBorder glowOnHover className="space-y-4 h-full">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`h-11 w-11 rounded-xl border flex items-center justify-center shrink-0 ${
                          member.color === "cyan"
                            ? "bg-cyan-accent/10 border-cyan-accent/30 text-cyan-accent"
                            : "bg-electric-blue/10 border-electric-blue/30 text-electric-blue"
                        }`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className={`font-heading text-sm font-bold uppercase tracking-wide ${
                            member.color === "cyan" ? "text-cyan-accent" : "text-electric-blue"
                          }`}>
                            {member.name}
                          </h3>
                          <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">{member.role}</p>
                        </div>
                      </div>

                      <a
                        href={member.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="h-8 w-8 rounded-lg border border-space-navy-800 bg-space-navy-900 flex items-center justify-center text-slate-500 hover:text-white hover:border-slate-600 transition-all shrink-0"
                        title="GitHub Profile"
                      >
                        <GithubIcon className="h-4 w-4" />
                      </a>
                    </div>

                    <p className="text-xs text-slate-400 font-sans leading-relaxed">{member.bio}</p>

                    <div className="bg-space-navy-950/60 border border-space-navy-800 rounded-lg px-3 py-2">
                      <span className="text-[8px] font-mono text-slate-600 uppercase tracking-widest block mb-1">Focus areas</span>
                      <span className="text-[10px] font-mono text-slate-300">{member.focus}</span>
                    </div>
                  </GlassCard>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </SectionContainer>

      {/* ─── MODEL SPECS ──────────────────────────────────────────────────── */}
      <SectionContainer className="border-b border-space-navy-900">
        <div className="max-w-5xl mx-auto space-y-10">
          <div className="text-center space-y-3">
            <Badge variant="status" statusColor="cyan">MODEL ARCHITECTURE</Badge>
            <h2 className="font-heading text-2xl md:text-3xl font-bold uppercase text-white tracking-wider">
              CNN-Attention-RIFE Architecture
            </h2>
            <p className="font-sans text-sm text-slate-400 max-w-xl mx-auto leading-relaxed">
              A custom hybrid model combining convolutional feature extraction, temporal cross-attention, 
              RIFE-style optical flow, and a learned fusion module.
            </p>
          </div>

          {/* Architecture pipeline diagram */}
          <div className="bg-space-navy-900/60 border border-space-navy-900 rounded-xl p-6 overflow-x-auto">
            <div className="flex items-center space-x-3 min-w-[600px]">
              {[
                { label: "Frame A + B", sub: "NetCDF input", color: "text-slate-400 border-space-navy-700" },
                { label: "CNN Encoder", sub: "5× stride-2\n96 channels", color: "text-electric-blue border-electric-blue/30", glow: true },
                { label: "Temporal\nTransformer", sub: "Cross-attention\n6 heads", color: "text-cyan-accent border-cyan-accent/30", glow: true },
                { label: "RIFE Flow Net", sub: "Bi-directional\noptical flow", color: "text-cyan-accent border-cyan-accent/30", glow: true },
                { label: "Warp + Fusion", sub: "Learned mask\nblended output", color: "text-emerald-400 border-emerald-400/30", glow: true },
                { label: "Frame t", sub: "Interpolated\nNetCDF", color: "text-slate-300 border-space-navy-700" }
              ].map((node, i, arr) => (
                <React.Fragment key={node.label}>
                  <div className={`flex flex-col items-center text-center p-3 rounded-xl border shrink-0 min-w-[100px] ${node.color} ${node.glow ? "bg-space-navy-950/80" : "bg-space-navy-950/40"}`}>
                    <span className="font-heading text-[11px] font-bold uppercase whitespace-pre-line leading-tight">{node.label}</span>
                    <span className="font-mono text-[8px] text-slate-500 mt-1 whitespace-pre-line leading-tight">{node.sub}</span>
                  </div>
                  {i < arr.length - 1 && (
                    <div className="text-cyan-accent/40 font-bold shrink-0">→</div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Metric highlight */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Best Val SSIM", value: "0.9319", sub: "epoch 9", color: "text-cyan-accent border-cyan-accent/25 bg-cyan-accent/5" },
              { label: "Feature Dim", value: "96", sub: "channels", color: "text-white border-space-navy-800 bg-space-navy-950" },
              { label: "Attn Heads", value: "6", sub: "multi-head", color: "text-white border-space-navy-800 bg-space-navy-950" },
              { label: "Encoder Depth", value: "5×", sub: "stride-2 blocks", color: "text-white border-space-navy-800 bg-space-navy-950" }
            ].map((stat) => (
              <div key={stat.label} className={`border rounded-xl p-4 text-center ${stat.color}`}>
                <span className="text-[8px] font-mono uppercase tracking-widest block text-slate-500 mb-1">{stat.label}</span>
                <span className="text-2xl font-heading font-black">{stat.value}</span>
                <span className="text-[9px] font-mono text-slate-500 block mt-0.5">{stat.sub}</span>
              </div>
            ))}
          </div>
        </div>
      </SectionContainer>

      {/* ─── TECH STACK ───────────────────────────────────────────────────── */}
      <SectionContainer className="border-b border-space-navy-900">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <Badge variant="status" statusColor="cyan">TECHNOLOGY STACK</Badge>
            <h2 className="font-heading text-xl md:text-2xl font-bold uppercase text-white tracking-wider">
              Built With
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {TECH_STACK.map((tech) => (
              <div key={tech.label}
                className="bg-space-navy-900 border border-space-navy-800 hover:border-cyan-accent/30 rounded-xl p-3.5 transition-colors group">
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

      {/* ─── BOTTOM CTA ───────────────────────────────────────────────────── */}
      <SectionContainer>
        <div className="max-w-3xl mx-auto">
          <GlassCard techBorder className="text-center py-10 px-6 md:px-12 space-y-5">
            <div className="mx-auto h-12 w-12 rounded-full border border-cyan-accent/20 bg-space-navy-900 flex items-center justify-center text-cyan-accent">
              <Satellite className="h-6 w-6 animate-pulse" />
            </div>
            <h2 className="font-heading text-xl md:text-2xl font-bold text-white uppercase tracking-wider">
              See It In Action
            </h2>
            <p className="font-sans text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
              Pick any cyclone, select two anchor frames, hit Interpolate — and watch our AI generate the missing moment.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Link href="/demo">
                <Button variant="primary" size="lg" icon={Play}>
                  Launch Demo
                </Button>
              </Link>
              <a href="https://github.com/sanskaraut/ISRO-Hackathon" target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="lg" icon={GithubIcon as any}>
                  GitHub Repository
                </Button>
              </a>
            </div>
            <div className="pt-4 border-t border-space-navy-800 text-[10px] font-mono text-slate-600 uppercase tracking-widest">
              CYC-INTEL // ISRO PS-12 // 2026
            </div>
          </GlassCard>
        </div>
      </SectionContainer>

    </div>
  );
}
