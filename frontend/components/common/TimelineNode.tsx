import React from "react";
import { cn } from "@/lib/utils";
import { Check, Clock, Play } from "lucide-react";

interface TimelineNodeProps {
  timeLabel: string;
  title: string;
  type: "raw" | "interpolated" | "future";
  isActive?: boolean;
  isCompleted?: boolean;
  description?: string;
  className?: string;
}

export default function TimelineNode({
  timeLabel,
  title,
  type,
  isActive = false,
  isCompleted = false,
  description,
  className,
}: TimelineNodeProps) {
  const nodeTypeConfig = {
    raw: {
      border: "border-electric-blue/40",
      bg: "bg-space-navy-900",
      text: "text-electric-blue",
      dot: "bg-electric-blue glow-dot-blue",
    },
    interpolated: {
      border: "border-cyan-accent/50",
      bg: "bg-space-navy-900",
      text: "text-cyan-accent",
      dot: "bg-cyan-accent glow-dot-cyan",
    },
    future: {
      border: "border-space-navy-800",
      bg: "bg-space-navy-950",
      text: "text-slate-500",
      dot: "bg-slate-700",
    },
  };

  const currentType = nodeTypeConfig[type];

  return (
    <div className={cn("flex space-x-4 relative group", className)}>
      {/* Node status indicators */}
      <div className="flex flex-col items-center">
        <div
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-full border-2 bg-space-navy-900 transition-all duration-300",
            isActive ? "scale-110 border-cyan-accent shadow-[0_0_15px_rgba(0,245,212,0.3)]" : currentType.border
          )}
        >
          {isCompleted ? (
            <Check className="h-4 w-4 text-emerald-400" />
          ) : isActive ? (
            <Play className="h-4 w-4 text-cyan-accent animate-pulse" />
          ) : type === "interpolated" ? (
            <Clock className="h-4 w-4 text-cyan-accent" />
          ) : (
            <div className={cn("h-2.5 w-2.5 rounded-full", currentType.dot)} />
          )}
        </div>
        
        {/* Node tail connector */}
        <div className="w-0.5 grow bg-space-navy-800 group-last:hidden mt-2 h-12"></div>
      </div>

      {/* Node content details */}
      <div className="flex flex-col pb-6">
        <div className="flex items-center space-x-2">
          <span className="font-mono text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-space-navy-900 px-2 py-0.5 rounded border border-space-navy-850">
            {timeLabel}
          </span>
          <span
            className={cn(
              "font-mono text-[10px] font-bold uppercase tracking-wider",
              type === "interpolated" ? "text-cyan-accent" : "text-slate-400"
            )}
          >
            {type === "raw" ? "INSAT Raw Sensor" : type === "interpolated" ? "AI Frame (30 fps)" : "Next Acquisition"}
          </span>
        </div>
        
        <h3 className={cn(
          "font-heading text-sm font-semibold tracking-wide mt-1.5",
          isActive ? "text-white" : "text-slate-200"
        )}>
          {title}
        </h3>
        
        {description && (
          <p className="font-sans text-xs text-slate-400 mt-1 max-w-sm leading-relaxed">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}
