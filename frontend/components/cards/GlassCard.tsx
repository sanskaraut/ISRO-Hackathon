"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hoverEffect?: boolean;
  techBorder?: boolean;
  glowOnHover?: boolean;
  delay?: number;
}

export default function GlassCard({
  children,
  className,
  hoverEffect = false,
  techBorder = false,
  glowOnHover = false,
  delay = 0,
}: GlassCardProps) {
  const Component = hoverEffect ? motion.div : "div";
  
  const motionProps = hoverEffect
    ? {
        initial: { opacity: 0, y: 15 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, margin: "-50px" },
        transition: { duration: 0.5, delay },
      }
    : {};

  return (
    <Component
      {...motionProps}
      className={cn(
        "glass-panel rounded-lg p-5 relative overflow-hidden transition-all duration-300",
        techBorder && "tech-corners",
        glowOnHover && "glass-panel-hover",
        className
      )}
    >
      {/* Visual tech line decoration */}
      <div className="absolute top-0 right-0 w-12 h-[1px] bg-gradient-to-l from-cyan-accent/25 to-transparent"></div>
      <div className="absolute bottom-0 left-0 w-12 h-[1px] bg-gradient-to-r from-electric-blue/20 to-transparent"></div>
      
      {children}
    </Component>
  );
}
