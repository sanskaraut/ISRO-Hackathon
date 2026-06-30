"use client";

import React, { use } from "react";
import PageHeader from "@/components/common/PageHeader";
import SectionContainer from "@/components/common/SectionContainer";
import GlassCard from "@/components/cards/GlassCard";
import Badge from "@/components/ui/Badge";
import Link from "next/link";
import { ArrowLeft, Orbit, Play } from "lucide-react";
import Button from "@/components/ui/Button";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function CycloneDetailsPage({ params }: PageProps) {
  const { id } = use(params);
  const cycloneName = id.split("-")[0].toUpperCase();
  const year = id.split("-")[1] || "2020";

  const breadcrumbs = [
    { label: "EXPLORER", href: "/explorer" },
    { label: `${cycloneName} (${year})` },
  ];

  return (
    <div className="min-h-screen bg-space-navy-950">
      <PageHeader
        title={`ANALYSIS // CYCLONE ${cycloneName}`}
        subtitle={`Real-time telemetry and temporal interpolation sequence for Cyclone ${cycloneName} (${year}).`}
        breadcrumbs={breadcrumbs}
        extra={
          <Badge variant="status" statusColor="cyan">
            SEQUENCE ACTIVE
          </Badge>
        }
      />
      
      <SectionContainer>
        <div className="max-w-4xl mx-auto space-y-6">
          <Link href="/explorer">
            <Button variant="secondary" size="sm" icon={ArrowLeft}>
              Back to Explorer
            </Button>
          </Link>
          
          <GlassCard techBorder glowOnHover className="text-center py-12 space-y-6">
            <div className="mx-auto h-12 w-12 rounded-full border border-cyan-accent/20 bg-space-navy-900 flex items-center justify-center text-cyan-accent">
              <Orbit className="h-6 w-6 animate-spin" style={{ animationDuration: "12s" }} />
            </div>
            
            <div className="space-y-2">
              <h2 className="font-heading text-xl font-bold text-white tracking-wide uppercase">
                Satellite Sequence Container: {id}
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                SATELLITE SOURCE: INSAT-3D/3DR INFRARED CHANNEL (TIR-1, 10.8 µm)
              </p>
            </div>
            
            <p className="text-sm text-slate-400 max-w-lg mx-auto leading-relaxed">
              This space will render the frame interpolation viewer, showing the low-temporal resolution inputs (e.g., 30-minute intervals) alongside the generated high-temporal resolution outputs (e.g., 10-minute intervals).
            </p>
            
            <div className="flex justify-center pt-4">
              <Link href="/demo">
                <Button variant="primary" icon={Play}>
                  Open in Workspace
                </Button>
              </Link>
            </div>
          </GlassCard>
        </div>
      </SectionContainer>
    </div>
  );
}
