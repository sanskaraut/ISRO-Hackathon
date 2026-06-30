"use client";

import React from "react";
import { motion, HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

interface ButtonProps extends HTMLMotionProps<"button"> {
  variant?: "primary" | "secondary" | "outline" | "glass" | "danger";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  iconPosition?: "left" | "right";
  isLoading?: boolean;
}

export default function Button({
  className,
  variant = "primary",
  size = "md",
  children,
  icon: Icon,
  iconPosition = "left",
  isLoading,
  ...props
}: ButtonProps) {
  const baseStyles = "inline-flex items-center justify-center font-mono font-semibold uppercase tracking-wider rounded transition-all duration-300 focus:outline-none focus:ring-1 focus:ring-cyan-accent disabled:opacity-50 disabled:pointer-events-none cursor-pointer";
  
  const sizeStyles = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-5 py-2 text-sm",
    lg: "px-8 py-3 text-base",
  };

  const variantStyles = {
    primary: "bg-electric-blue text-white hover:bg-electric-blue/90 border border-electric-blue/40 shadow-[0_0_15px_rgba(58,134,255,0.2)] hover:shadow-[0_0_20px_rgba(58,134,255,0.4)]",
    secondary: "bg-space-navy-800 text-slate-100 hover:bg-space-navy-700 border border-space-navy-700 hover:border-slate-500",
    outline: "bg-transparent text-cyan-accent border border-cyan-accent/30 hover:bg-cyan-accent/10 hover:border-cyan-accent/60 shadow-[0_0_10px_rgba(0,245,212,0.05)] hover:shadow-[0_0_15px_rgba(0,245,212,0.2)]",
    glass: "glass-panel text-white hover:bg-space-navy-800/80 border border-space-navy-800 hover:border-cyan-accent/40 shadow-[0_0_15px_rgba(8,15,30,0.5)]",
    danger: "bg-red-950/20 text-red-400 hover:bg-red-900/40 border border-red-500/30 hover:border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.15)]",
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn(baseStyles, sizeStyles[size], variantStyles[variant], className)}
      {...props}
    >
      {isLoading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      )}
      {!isLoading && Icon && iconPosition === "left" && (
        <Icon className={cn("h-4 w-4 mr-2", size === "sm" ? "h-3.5 w-3.5 mr-1.5" : "")} />
      )}
      <span>{children}</span>
      {!isLoading && Icon && iconPosition === "right" && (
        <Icon className={cn("h-4 w-4 ml-2", size === "sm" ? "h-3.5 w-3.5 ml-1.5" : "")} />
      )}
    </motion.button>
  );
}
