import React from "react";
import GlassCard from "./GlassCard";
import Badge from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  unit?: string;
  statusText?: string;
  statusColor?: "blue" | "cyan" | "emerald" | "amber" | "red";
  trend?: string;
  trendDirection?: "up" | "down" | "neutral";
  description?: string;
  className?: string;
}

export default function StatCard({
  label,
  value,
  unit,
  statusText,
  statusColor = "cyan",
  trend,
  trendDirection = "neutral",
  description,
  className,
}: StatCardProps) {
  return (
    <GlassCard className={cn("flex flex-col justify-between h-full min-h-[140px]", className)} techBorder glowOnHover>
      <div className="flex items-start justify-between">
        <span className="font-mono text-[10px] uppercase tracking-widest text-slate-400">
          {label}
        </span>
        {statusText && (
          <Badge variant="status" statusColor={statusColor}>
            {statusText}
          </Badge>
        )}
      </div>

      <div className="mt-4 mb-2 flex items-baseline space-x-1.5">
        <span className="font-heading text-3xl font-bold tracking-tight text-white glow-text-cyan">
          {value}
        </span>
        {unit && (
          <span className="font-mono text-xs uppercase text-slate-400">
            {unit}
          </span>
        )}
      </div>

      <div className="mt-auto flex items-center justify-between pt-2 border-t border-space-navy-850">
        {trend && (
          <span
            className={cn(
              "font-mono text-[10px] uppercase tracking-wider",
              trendDirection === "up" && "text-success-emerald",
              trendDirection === "down" && "text-red-400",
              trendDirection === "neutral" && "text-slate-400"
            )}
          >
            {trend}
          </span>
        )}
        {description && (
          <span className="font-sans text-[10px] text-slate-500 text-right truncate max-w-[150px]">
            {description}
          </span>
        )}
      </div>
    </GlassCard>
  );
}
