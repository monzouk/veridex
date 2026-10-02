'use client';

import { useEffect, useRef } from 'react';

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  isAmber: boolean;
}

export default function EvidenceCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let isVisible = true;
    let isTabActive = document.visibilityState !== 'hidden';

    // Respect reduced motion: draw static once, do not animate
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Detect screen and hardware capabilities
    const isMobile = window.innerWidth < 768;
    const isLowPower = (navigator.hardwareConcurrency || 4) <= 4;
    const nodeCount = isMobile ? (isLowPower ? 14 : 18) : (isLowPower ? 24 : 40);
    const maxLinkDistance = isMobile ? 85 : 120;

    let width = 0;
    let height = 0;
    let dpr = 1;

    const resize = () => {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      dpr = Math.min(window.devicePixelRatio || 1, 2); // Cap DPR at 2
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
    };

    resize();
    window.addEventListener('resize', resize, { passive: true });

    // Initialize nodes
    const nodes: Node[] = [];
    for (let i = 0; i < nodeCount; i++) {
      nodes.push({
        x: Math.random() * (width || 800),
        y: Math.random() * (height || 600),
        vx: (Math.random() - 0.5) * (isMobile ? 0.25 : 0.4),
        vy: (Math.random() - 0.5) * (isMobile ? 0.25 : 0.4),
        radius: Math.random() > 0.8 ? 2 : 1.2,
        isAmber: Math.random() > 0.65,
      });
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw connecting evidence lines
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < maxLinkDistance) {
            const alpha = (1 - dist / maxLinkDistance) * 0.18;
            ctx.beginPath();
            ctx.strokeStyle = a.isAmber
              ? `rgba(242, 154, 61, ${alpha})`
              : `rgba(79, 100, 64, ${alpha})`;
            ctx.lineWidth = 0.8;
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      // Draw nodes
      for (const node of nodes) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fillStyle = node.isAmber
          ? 'rgba(255, 196, 107, 0.45)'
          : 'rgba(134, 170, 112, 0.45)';
        ctx.fill();

        if (!prefersReducedMotion) {
          node.x += node.vx;
          node.y += node.vy;

          if (node.x < 0) node.x = width;
          else if (node.x > width) node.x = 0;

          if (node.y < 0) node.y = height;
          else if (node.y > height) node.y = 0;
        }
      }

      if (!prefersReducedMotion && isVisible && isTabActive) {
        animationFrameId = requestAnimationFrame(render);
      }
    };

    render();

    // IntersectionObserver to pause when hero is off-screen
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        isVisible = entry.isIntersecting;
        if (isVisible && isTabActive && !prefersReducedMotion) {
          cancelAnimationFrame(animationFrameId);
          animationFrameId = requestAnimationFrame(render);
        }
      },
      { threshold: 0.05 }
    );

    observer.observe(canvas);

    // Visibility change to pause when tab is hidden
    const handleVisibilityChange = () => {
      isTabActive = document.visibilityState !== 'hidden';
      if (isVisible && isTabActive && !prefersReducedMotion) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = requestAnimationFrame(render);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      cancelAnimationFrame(animationFrameId);
      observer.disconnect();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="hero-evidence-canvas"
      aria-hidden="true"
    />
  );
}
