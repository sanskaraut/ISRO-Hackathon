"use client";

import React from "react";
import PageHeader from "@/components/common/PageHeader";
import SectionContainer from "@/components/common/SectionContainer";
import GlassCard from "@/components/cards/GlassCard";
import Badge from "@/components/ui/Badge";
import Link from "next/link";
import { Compass, AlertTriangle, ArrowRight, Eye } from "lucide-react";
import Button from "@/components/ui/Button";

// Actual historical cyclone metadata for realism
const CYCLONES = [
  {
    id: "amphan-2020",
    name: "AMPHAN",
    year: 2020,
    basin: "North Indian Ocean (Bay of Bengal)",
    category: "Super Cyclonic Storm (Cat 5 equivalent)",
    maxWind: "240 km/h",
    pressure: "925 hPa",
    status: "ARCHIVED",
  },
  {
    id: "fani-2019",
    name: "FANI",
    year: 2019,
    basin: "North Indian Ocean (Bay of Bengal)",
    category: "Extremely Severe Cyclonic Storm (Cat 4 equivalent)",
    maxWind: "215 km/h",
    pressure: "937 hPa",
    status: "ARCHIVED",
  },
  {
    id: "tauktae-2021",
    name: "TAUKTAE",
    year: 2021,
    basin: "North Indian Ocean (Arabian Sea)",
    category: "Extremely Severe Cyclonic Storm (Cat 4 equivalent)",
    maxWind: "220 km/h",
    pressure: "950 hPa",
    status: "ARCHIVED",
  },
  {
    id: "biparjoy-2023",
    name: "BIPARJOY",
    year: 2023,
    basin: "North Indian Ocean (Arabian Sea)",
    category: "Very Severe Cyclonic Storm (Cat 3 equivalent)",
    maxWind: "165 km/h",
    pressure: "960 hPa",
    status: "ARCHIVED",
  },
];

export default function ExplorerPage() {
  const breadcrumbs = [{ label: "CYCLONE EXPLORER" }];

  return (
    <div className="min-h-screen bg-space-navy-950">
      <PageHeader
        title="SATELLITE DATA EXPLORER"
        subtitle="Access INSAT-3D / 3DR historical cyclone imagery sequences and telemetry archives."
        breadcrumbs={breadcrumbs}
        extra={
          <Badge variant="status" statusColor="emerald">
            ARCHIVE ONLINE
          </Badge>
        }
      />
      
      <SectionContainer>
        <div className="space-y-6">
          <div className="flex items-center space-x-2 text-slate-300">
            <Compass className="h-5 w-5 text-cyan-accent" />
            <h2 className="font-heading text-lg font-bold tracking-wider uppercase">
              Historical Cyclone Sequences
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {CYCLONES.map((cyclone) => (
              <GlassCard key={cyclone.id} techBorder glowOnHover className="flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <span className="font-mono text-xs text-slate-500 font-bold">
                        ID: {cyclone.id.toUpperCase()}
                      </span>
                      <h3 className="font-heading text-xl font-bold text-white tracking-wide">
                        CYCLONE {cyclone.name} ({cyclone.year})
                      </h3>
                    </div>
                    <Badge variant="success">
                      {cyclone.status}
                    </Badge>
                  </div>
                  
                  <div className="mt-4 grid grid-cols-2 gap-y-3 gap-x-2 border-t border-space-navy-800 pt-4 font-mono text-xs">
                    <div>
                      <span className="text-slate-500 block">BASIN</span>
                      <span className="text-slate-300 font-semibold">{cyclone.basin}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">CLASSIFICATION</span>
                      <span className="text-slate-300 font-semibold">{cyclone.category}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">MAX SUSTAINED WIND</span>
                      <span className="text-cyan-accent font-semibold">{cyclone.maxWind}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">MIN CENTRAL PRESSURE</span>
                      <span className="text-cyan-accent font-semibold">{cyclone.pressure}</span>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 flex justify-end">
                  <Link href={`/cyclone/${cyclone.id}`}>
                    <Button variant="outline" size="sm" icon={Eye}>
                      Analyze Imagery
                    </Button>
                  </Link>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
      </SectionContainer>
    </div>
  );
}
