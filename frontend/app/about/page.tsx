"use client";

import React from "react";
import PageHeader from "@/components/common/PageHeader";
import SectionContainer from "@/components/common/SectionContainer";
import GlassCard from "@/components/cards/GlassCard";
import Badge from "@/components/ui/Badge";
import Link from "next/link";
import { Info, Satellite, Cpu, ShieldAlert } from "lucide-react";
import Button from "@/components/ui/Button";

export default function AboutPage() {
  const breadcrumbs = [{ label: "ABOUT MODEL" }];

  return (
    <div className="min-h-screen bg-space-navy-950">
      <PageHeader
        title="ABOUT INTERPOLATION MODEL"
        subtitle="Deep Learning architecture specifications, sensor specs, and temporal frame generation pipeline details."
        breadcrumbs={breadcrumbs}
        extra={
          <Badge variant="status" statusColor="blue">
            DOCS ONLINE
          </Badge>
        }
      />
      
      <SectionContainer>
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="flex items-center space-x-2 text-slate-300">
            <Info className="h-5 w-5 text-cyan-accent" />
            <h2 className="font-heading text-lg font-bold tracking-wider uppercase">
              Model Specs & Architecture
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <GlassCard techBorder glowOnHover className="space-y-3">
              <Cpu className="h-6 w-6 text-electric-blue" />
              <h3 className="font-heading text-sm font-semibold text-white">Neural Net Model</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-mono">
                PyTorch-based Deep Temporal Interpolation Network. Uses optical flow mapping alongside Conv2D/Deconv2D layers.
              </p>
            </GlassCard>
            
            <GlassCard techBorder glowOnHover className="space-y-3">
              <Satellite className="h-6 w-6 text-cyan-accent" />
              <h3 className="font-heading text-sm font-semibold text-white">Sensor Target</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-mono">
                INSAT-3D and INSAT-3DR Imager payloads. Channels: Thermal Infrared (TIR1/TIR2) and Water Vapor (WV).
              </p>
            </GlassCard>
            
            <GlassCard techBorder glowOnHover className="space-y-3">
              <ShieldAlert className="h-6 w-6 text-success-emerald" />
              <h3 className="font-heading text-sm font-semibold text-white">Objective</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-mono">
                Increase temporal resolution of INSAT scans from 30 minutes down to 10 minutes to track eye rotation and intensity.
              </p>
            </GlassCard>
          </div>
          
          <GlassCard techBorder className="p-6">
            <h3 className="font-heading text-base font-bold text-white tracking-wide uppercase mb-4">
              Model Pipeline Staging
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed font-mono">
              The neural model receives two sequential images ($I_0$ and $I_1$) spaced 30 minutes apart. 
              The PyTorch model calculates bi-directional flow vectors and reconstructs intermediate frames ($I_t$ where 0 &lt; t &lt; 1) 
              representing intermediate time offsets (e.g. 10 and 20 minutes). This yields continuous 30-fps video representations 
              of the cyclone lifecycle.
            </p>
          </GlassCard>
        </div>
      </SectionContainer>
    </div>
  );
}
