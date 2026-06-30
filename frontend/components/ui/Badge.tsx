import React from "react";
import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "status" | "metric" | "outline" | "success" | "warning" | "error" | "info";
  statusColor?: "blue" | "cyan" | "emerald" | "amber" | "red";
  className?: string;
}

export default function Badge({
  children,
  variant = "outline",
  statusColor = "cyan",
  className,
}: BadgeProps) {
  const dotColorClass = {
    blue: "bg-electric-blue glow-dot-blue",
    cyan: "bg-cyan-accent glow-dot-cyan",
    emerald: "bg-success-emerald glow-dot-emerald",
    amber: "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]",
    red: "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]",
  };

  const variants = {
    status: "inline-flex items-center space-x-1.5 px-2 py-0.5 rounded border border-space-navy-850 bg-space-navy-900/80 font-mono text-[10px] tracking-wider text-slate-300 font-semibold uppercase",
    metric: "inline-flex items-center px-1.5 py-0.5 rounded border border-cyan-accent/20 bg-cyan-accent/5 font-mono text-[10px] font-bold text-cyan-accent tracking-wider",
    outline: "inline-flex items-center px-2 py-0.5 rounded border border-space-navy-800 bg-transparent font-mono text-[10px] text-slate-400 font-medium",
    success: "inline-flex items-center px-2 py-0.5 rounded border border-success-emerald/20 bg-success-emerald/5 font-mono text-[10px] font-semibold text-success-emerald uppercase",
    warning: "inline-flex items-center px-2 py-0.5 rounded border border-amber-500/20 bg-amber-500/5 font-mono text-[10px] font-semibold text-amber-500 uppercase",
    error: "inline-flex items-center px-2 py-0.5 rounded border border-red-500/20 bg-red-500/5 font-mono text-[10px] font-semibold text-red-400 uppercase",
    info: "inline-flex items-center px-2 py-0.5 rounded border border-electric-blue/20 bg-electric-blue/5 font-mono text-[10px] font-semibold text-electric-blue uppercase",
  };

  return (
    <span className={cn(variants[variant], className)}>
      {variant === "status" && (
        <span className={cn("h-1.5 w-1.5 rounded-full", dotColorClass[statusColor])} />
      )}
      <span>{children}</span>
    </span>
  );
}
