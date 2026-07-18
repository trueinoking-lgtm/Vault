'use client';

import { useEffect, useRef } from 'react';

type Node = { x: number; y: number; vx: number; vy: number; phase: number; teal: boolean };

export default function NetworkBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let frame = 0;
    let nodes: Node[] = [];
    let width = 0;
    let height = 0;
    let lastFrame = 0;

    const seedNodes = () => {
      const count = width < 768 ? 12 : 24;
      nodes = Array.from({ length: count }, (_, index) => {
        const column = index % 6;
        const row = Math.floor(index / 6);
        return {
          x: ((column + 0.45 + (row % 2) * 0.42) / 6) * width,
          y: ((row + 0.55) / Math.ceil(count / 6)) * height,
          vx: ((index * 17) % 7 - 3) * 0.0035,
          vy: ((index * 11) % 7 - 3) * 0.0035,
          phase: index * 0.71,
          teal: index % 3 === 0,
        };
      });
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      seedNodes();
      draw(performance.now(), true);
    };

    const draw = (now: number, isStatic = false) => {
      context.clearRect(0, 0, width, height);
      const seconds = now / 1000;
      const maxDistance = width < 768 ? 150 : 230;

      if (!isStatic) {
        nodes.forEach((node) => {
          node.x += node.vx;
          node.y += node.vy;
          if (node.x < 0 || node.x > width) node.vx *= -1;
          if (node.y < 0 || node.y > height) node.vy *= -1;
        });
      }

      nodes.forEach((node, index) => {
        nodes.slice(index + 1).forEach((other, offset) => {
          const distance = Math.hypot(node.x - other.x, node.y - other.y);
          if (distance > maxDistance) return;
          context.beginPath();
          context.moveTo(node.x, node.y);
          context.lineTo(other.x, other.y);
          context.strokeStyle = `rgba(199,204,214,${0.25 * (1 - distance / maxDistance)})`;
          context.lineWidth = 0.7;
          context.stroke();

          if (!reduceMotion.matches && (index + offset) % 29 === 0) {
            const progress = (seconds * 0.16 + index * 0.13) % 1;
            const x = node.x + (other.x - node.x) * progress;
            const y = node.y + (other.y - node.y) * progress;
            context.beginPath();
            context.arc(x, y, 2.2, 0, Math.PI * 2);
            context.fillStyle = 'rgba(201,162,39,0.9)';
            context.fill();
          }
        });

        const breath = reduceMotion.matches ? 0.7 : 0.58 + Math.sin(seconds * 1.25 + node.phase) * 0.22;
        context.beginPath();
        context.arc(node.x, node.y, node.teal ? 2.6 : 2.2, 0, Math.PI * 2);
        context.fillStyle = node.teal
          ? `rgba(47,168,160,${breath})`
          : `rgba(201,162,39,${breath})`;
        context.fill();
      });
    };

    const loop = (now: number) => {
      if (now - lastFrame > 33) {
        draw(now);
        lastFrame = now;
      }
      frame = requestAnimationFrame(loop);
    };

    const updateMotion = () => {
      cancelAnimationFrame(frame);
      draw(performance.now(), true);
      if (!reduceMotion.matches) frame = requestAnimationFrame(loop);
    };
    const updateVisibility = () => {
      cancelAnimationFrame(frame);
      if (!document.hidden && !reduceMotion.matches) frame = requestAnimationFrame(loop);
    };

    resize();
    updateMotion();
    window.addEventListener('resize', resize, { passive: true });
    document.addEventListener('visibilitychange', updateVisibility);
    reduceMotion.addEventListener('change', updateMotion);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', updateVisibility);
      reduceMotion.removeEventListener('change', updateMotion);
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden="true" className="network-background" />;
}
