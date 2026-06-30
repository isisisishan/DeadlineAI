"use client";

import React, { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  type: "circle" | "triangle" | "diamond" | "square";
  color: string;
  tx: number; // Target X for shapes
  ty: number; // Target Y for shapes
}

export const ParticleField: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mouseRef = useRef({ x: -1000, y: -1000, active: false });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Particle[] = [];
    
    // Monochrome-skewed brand color palette (white, light gray, dark gray, with subtle brand highlight)
    const colors = [
      "#edfffe",  // Ice Mist
      "#bbc7c6",  // Fog Veil
      "#00827c",  // Current teal
      "#cbfffc",  // Aurora
      "#ffffff",  // Snow Sheet
      "rgba(237, 255, 254, 0.12)" // Ice Mist faint
    ];
    const shapes: ("circle" | "triangle" | "diamond" | "square")[] = [
      "circle",
      "triangle",
      "diamond",
      "square"
    ];

    let currentShapeIndex = -1; // -1 = free drift, 0 = Brain, 1 = Calendar, 2 = Network, 3 = Timeline, 4 = Decision Tree
    let shapeTimer = 0;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initParticles();
    };

    const getShapePoints = (index: number, count: number): { x: number; y: number }[] => {
      const points: { x: number; y: number }[] = [];
      const w = canvas.width;
      const h = canvas.height;
      const isDesktop = w >= 768;

      // Position shapes centered on desktop split (62% to the right) or center on mobile
      const centerX = isDesktop ? w * 0.62 : w * 0.5;
      const centerY = h * 0.5;
      // Make shapes much larger (occupying almost the entire right half)
      const sizeScale = isDesktop ? Math.min(w, h) * 0.45 : Math.min(w, h) * 0.4;

      switch (index) {
        case 0: // Brain Shape
          for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2;
            const lobe = i % 2 === 0 ? -1 : 1;
            const r = sizeScale * (0.55 + 0.3 * Math.abs(Math.sin(angle * 2)));
            const px = centerX + Math.cos(angle) * r * 0.85 + lobe * (sizeScale * 0.15);
            const py = centerY + Math.sin(angle) * r * 0.9 - (sizeScale * 0.05);
            points.push({ x: px, y: py });
          }
          break;

        case 1: // Calendar Grid Shape
          const rows = 6;
          const cols = 6;
          const gridPointsCount = rows * cols;
          for (let i = 0; i < count; i++) {
            const gridIdx = i % gridPointsCount;
            const rIdx = Math.floor(gridIdx / cols);
            const cIdx = gridIdx % cols;
            const px = centerX - (sizeScale * 0.45) + cIdx * (sizeScale * 0.18);
            const py = centerY - (sizeScale * 0.45) + rIdx * (sizeScale * 0.18);
            points.push({ x: px, y: py });
          }
          break;

        case 2: // Network Node Shape
          const nodes = [
            { x: centerX, y: centerY - sizeScale * 0.5 },
            { x: centerX - sizeScale * 0.4, y: centerY - sizeScale * 0.2 },
            { x: centerX + sizeScale * 0.4, y: centerY - sizeScale * 0.2 },
            { x: centerX - sizeScale * 0.35, y: centerY + sizeScale * 0.3 },
            { x: centerX + sizeScale * 0.35, y: centerY + sizeScale * 0.3 },
            { x: centerX, y: centerY + sizeScale * 0.5 },
            { x: centerX - sizeScale * 0.18, y: centerY },
            { x: centerX + sizeScale * 0.18, y: centerY }
          ];
          for (let i = 0; i < count; i++) {
            const nodeA = nodes[i % nodes.length];
            const nodeB = nodes[(i + 1) % nodes.length];
            const ratio = Math.random();
            points.push({
              x: nodeA.x + (nodeB.x - nodeA.x) * ratio,
              y: nodeA.y + (nodeB.y - nodeA.y) * ratio
            });
          }
          break;

        case 3: // Timeline Shape
          for (let i = 0; i < count; i++) {
            if (i % 6 === 0) {
              const tickIdx = (i / 6) % 5;
              const px = centerX - (sizeScale * 0.6) + tickIdx * (sizeScale * 0.3);
              const tickHeight = (i % 12 === 0 ? 1 : -1) * (sizeScale * 0.18);
              const ratio = Math.random();
              points.push({
                x: px,
                y: centerY + tickHeight * ratio
              });
            } else {
              const px = centerX - (sizeScale * 0.75) + (i / count) * (sizeScale * 1.5);
              points.push({
                x: px,
                y: centerY
              });
            }
          }
          break;

        case 4: // Decision Tree Shape
          const treeNodes = [
            { x: centerX, y: centerY - sizeScale * 0.5 },
            { x: centerX - sizeScale * 0.35, y: centerY - sizeScale * 0.1 },
            { x: centerX + sizeScale * 0.35, y: centerY - sizeScale * 0.1 },
            { x: centerX - sizeScale * 0.5, y: centerY + sizeScale * 0.35 },
            { x: centerX - sizeScale * 0.2, y: centerY + sizeScale * 0.35 },
            { x: centerX + sizeScale * 0.2, y: centerY + sizeScale * 0.35 },
            { x: centerX + sizeScale * 0.5, y: centerY + sizeScale * 0.35 }
          ];
          for (let i = 0; i < count; i++) {
            const group = i % 6;
            let parent = treeNodes[0];
            let child = treeNodes[1];

            if (group === 0) { parent = treeNodes[0]; child = treeNodes[1]; }
            else if (group === 1) { parent = treeNodes[0]; child = treeNodes[2]; }
            else if (group === 2) { parent = treeNodes[1]; child = treeNodes[3]; }
            else if (group === 3) { parent = treeNodes[1]; child = treeNodes[4]; }
            else if (group === 4) { parent = treeNodes[2]; child = treeNodes[5]; }
            else { parent = treeNodes[2]; child = treeNodes[6]; }

            const ratio = Math.random();
            points.push({
              x: parent.x + (child.x - parent.x) * ratio,
              y: parent.y + (child.y - parent.y) * ratio
            });
          }
          break;

        default:
          for (let i = 0; i < count; i++) {
            points.push({
              x: Math.random() * w,
              y: Math.random() * h
            });
          }
      }
      return points;
    };

    const initParticles = () => {
      particles = [];
      // Dense layout: ~450 particles on desktop, scaled down on smaller screens
      const particleCount = Math.min(450, Math.floor((canvas.width * canvas.height) / 3200));
      const w = canvas.width;
      const h = canvas.height;

      for (let i = 0; i < particleCount; i++) {
        // Spawn all over the screen
        const rx = Math.random() * w;
        const ry = Math.random() * h;
        
        particles.push({
          x: rx,
          y: ry,
          vx: (Math.random() - 0.5) * 0.45,
          vy: (Math.random() - 0.5) * 0.45,
          size: Math.random() * 2.5 + 1.0,
          type: shapes[Math.floor(Math.random() * shapes.length)],
          color: colors[Math.floor(Math.random() * colors.length)],
          tx: rx,
          ty: ry
        });
      }
    };

    const drawShape = (p: Particle) => {
      if (!ctx) return;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      
      if (p.type === "circle") {
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      } else if (p.type === "triangle") {
        ctx.moveTo(p.x, p.y - p.size);
        ctx.lineTo(p.x + p.size, p.y + p.size);
        ctx.lineTo(p.x - p.size, p.y + p.size);
        ctx.closePath();
      } else if (p.type === "diamond") {
        ctx.moveTo(p.x, p.y - p.size);
        ctx.lineTo(p.x + p.size, p.y);
        ctx.lineTo(p.x, p.y + p.size);
        ctx.lineTo(p.x - p.size, p.y);
        ctx.closePath();
      } else {
        ctx.rect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
      }
      ctx.fill();
    };

    const update = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const mouse = mouseRef.current;

      // Draw constellation linkages (increased connectivity for network look)
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const p1 = particles[i];
          const p2 = particles[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          if (dist < 110) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(255, 255, 255, ${0.11 * (1 - dist / 110)})`;
            ctx.lineWidth = 0.5;
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      }

      // Draw mouse constellation connection web
      if (mouse.active) {
        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];
          const dx = mouse.x - p.x;
          const dy = mouse.y - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 150) {
            ctx.beginPath();
            // Connect mouse to particles with a subtle Plum Voltage line
            ctx.strokeStyle = `rgba(0, 130, 124, ${0.25 * (1 - dist / 150)})`;
            ctx.lineWidth = 0.6;
            ctx.moveTo(mouse.x, mouse.y);
            ctx.lineTo(p.x, p.y);
            ctx.stroke();
          }
        }
      }

      // Draw and move particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        if (currentShapeIndex !== -1) {
          // Morphing to shape points
          p.x += (p.tx - p.x) * 0.07;
          p.y += (p.ty - p.y) * 0.07;
          p.vx = 0;
          p.vy = 0;
        } else {
          // Normal free drift across entire viewport with mouse repulsion (dispersion)
          if (mouse.active) {
            const dx = mouse.x - p.x;
            const dy = mouse.y - p.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 220) {
              // Gentle repelling force
              const force = ((220 - dist) / 220) * 0.3;
              p.vx -= (dx / dist) * force;
              p.vy -= (dy / dist) * force;
            }
          }

          p.x += p.vx;
          p.y += p.vy;

          p.vx += (Math.random() - 0.5) * 0.035;
          p.vy += (Math.random() - 0.5) * 0.035;

          p.vx *= 0.96;
          p.vy *= 0.96;

          // Wrap boundaries (particles can drift all over screen)
          if (p.x < 0) p.x = canvas.width;
          if (p.x > canvas.width) p.x = 0;
          if (p.y < 0) p.y = canvas.height;
          if (p.y > canvas.height) p.y = 0;
        }

        drawShape(p);
      }

      animationFrameId = requestAnimationFrame(update);
    };

    const handleTimerTick = () => {
      shapeTimer++;
      const cyclePeriod = 480; // 8 seconds at 60fps
      const activePeriod = 200; // ~3.3 seconds holding shape
      
      const currentCyclePhase = shapeTimer % cyclePeriod;
      
      if (currentCyclePhase === 0) {
        currentShapeIndex = (currentShapeIndex + 1) % 5;
        const targetPoints = getShapePoints(currentShapeIndex, particles.length);
        particles.forEach((p, idx) => {
          if (targetPoints[idx]) {
            p.tx = targetPoints[idx].x;
            p.ty = targetPoints[idx].y;
          }
        });
      } else if (currentCyclePhase === activePeriod) {
        currentShapeIndex = -1; // Dissolve back to drift
      }
    };

    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();

    // Use a regular interval check to coordinate updates
    const timerInterval = setInterval(handleTimerTick, 16.6); // roughly 60fps

    // Kick off animation loop
    update();

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
      mouseRef.current.active = true;
    };

    const handleMouseLeave = () => {
      mouseRef.current.active = false;
      mouseRef.current.x = -1000;
      mouseRef.current.y = -1000;
    };

    window.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      cancelAnimationFrame(animationFrameId);
      clearInterval(timerInterval);
      window.removeEventListener("resize", resizeCanvas);
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-0 bg-transparent"
    />
  );
};
