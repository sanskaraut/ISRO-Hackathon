"use client";

import React, { useEffect, useRef } from "react";

export default function Starfield() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Star data structures
    const stars: { x: number; y: number; size: number; speed: number; alpha: number; delta: number }[] = [];
    const count = 60; // Keep it low and minimal

    for (let i = 0; i < count; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 1.2 + 0.3, // very tiny stars
        speed: Math.random() * 0.05 + 0.02, // very slow drift
        alpha: Math.random() * 0.5 + 0.2,
        delta: Math.random() * 0.02 + 0.005, // twinkling speed
      });
    }

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", handleResize);

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      stars.forEach((star) => {
        // Twinkle alpha fluctuation
        star.alpha += star.delta;
        if (star.alpha > 0.85 || star.alpha < 0.15) {
          star.delta = -star.delta;
        }

        // Draw star
        ctx.fillStyle = `rgba(0, 245, 212, ${star.alpha})`; // Cyan tinted stars
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();

        // Drift star slowly
        star.x -= star.speed;
        
        // Wrap star around borders
        if (star.x < 0) {
          star.x = width;
          star.y = Math.random() * height;
        }
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none -z-10 bg-transparent"
    />
  );
}
