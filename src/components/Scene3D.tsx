import { useEffect, useRef } from "react";

// Abstract flowing data: elegant blue-and-silver curves drifting across the
// viewport, with small glowing particles travelling along them to suggest
// data movement and integration. Premium, calm, decorative only
// (aria-hidden, pointer-events none).

interface FlowLine {
  baseY: number; // fraction of viewport height (0..1)
  amp1: number;
  amp2: number;
  freq1: number;
  freq2: number;
  speed1: number;
  speed2: number;
  phase: number;
  width: number;
  tone: number; // 0 = deep blue, 1 = silver
  alpha: number;
}

interface Droplet {
  line: number;
  t: number; // 0..1 across the width
  speed: number;
}

const isMobile = () =>
  typeof window !== "undefined" && window.innerWidth < 860;

const LINES_DESKTOP = 7;
const LINES_MOBILE = 4;
const DROPLETS_DESKTOP = 22;
const DROPLETS_MOBILE = 8;

// deep blue -> steel silver stops
function strokeFor(tone: number, alpha: number) {
  const r = Math.round(37 + (148 - 37) * tone);
  const g = Math.round(99 + (163 - 99) * tone);
  const b = Math.round(235 + (184 - 235) * tone);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export default function Scene3D() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const linesRef = useRef<FlowLine[]>([]);
  const dropletsRef = useRef<Droplet[]>([]);
  const mouseRef = useRef({ x: -9999, y: -9999 });
  const animRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const mobile = isMobile();
    const lineCount = mobile ? LINES_MOBILE : LINES_DESKTOP;
    const dropletCount = mobile ? DROPLETS_MOBILE : DROPLETS_DESKTOP;

    const yAt = (line: FlowLine, x: number, h: number, time: number) => {
      return (
        line.baseY * h +
        Math.sin(x * line.freq1 + time * line.speed1 + line.phase) * line.amp1 +
        Math.sin(x * line.freq2 - time * line.speed2 + line.phase * 1.7) * line.amp2
      );
    };

    const init = (height: number) => {
      const lines: FlowLine[] = [];
      for (let i = 0; i < lineCount; i++) {
        const pos = i / (lineCount - 1);
        lines.push({
          baseY: 0.16 + pos * 0.68,
          amp1: 26 + Math.random() * 34,
          amp2: 10 + Math.random() * 18,
          freq1: 0.0016 + Math.random() * 0.0012,
          freq2: 0.004 + Math.random() * 0.003,
          speed1: 0.25 + Math.random() * 0.35,
          speed2: 0.15 + Math.random() * 0.25,
          phase: Math.random() * Math.PI * 2,
          width: 1 + Math.random() * 1.6,
          tone: Math.random(),
          alpha: 0.28 + Math.random() * 0.3,
        });
      }
      // keep a silver anchor line and a blue anchor line for the palette story
      if (lines.length > 1) {
        lines[0].tone = 1;
        lines[lines.length - 1].tone = 0;
      }
      linesRef.current = lines;
      void height;

      const droplets: Droplet[] = [];
      for (let i = 0; i < dropletCount; i++) {
        droplets.push({
          line: Math.floor(Math.random() * lineCount),
          t: Math.random(),
          speed: 0.0009 + Math.random() * 0.0022,
        });
      }
      dropletsRef.current = droplets;
    };

    const dpr = Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 2);

    const resize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      init(h);
    };

    const drawLines = (w: number, h: number, time: number, my: number) => {
      const step = mobile ? 18 : 14;
      for (const line of linesRef.current) {
        const near = my < -100 ? 0 : Math.max(0, 1 - Math.abs(my - line.baseY * h) / 320);
        const alpha = Math.min(0.85, line.alpha + near * 0.3);

        // soft silver echo beneath for depth
        ctx.strokeStyle = strokeFor(1, alpha * 0.35);
        ctx.lineWidth = line.width + 3;
        ctx.lineCap = "round";
        ctx.beginPath();
        for (let x = -20; x <= w + 20; x += step) {
          const y = yAt(line, x, h, time) + 7;
          if (x <= -20 + step) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();

        // main elegant curve
        ctx.strokeStyle = strokeFor(line.tone, alpha);
        ctx.lineWidth = line.width;
        ctx.beginPath();
        for (let x = -20; x <= w + 20; x += step) {
          const y = yAt(line, x, h, time);
          if (x <= -20 + step) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
    };

    // Reduced motion: one static frame, no loop, no listeners.
    if (typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      resize();
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      drawLines(window.innerWidth, window.innerHeight, 0, -9999);
      return;
    }

    const handleMouse = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    const handleTouch = (e: TouchEvent) => {
      const t = e.touches[0];
      if (t) mouseRef.current = { x: t.clientX, y: t.clientY };
    };
    const handlePointerLeave = () => {
      mouseRef.current = { x: -9999, y: -9999 };
    };

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", handleMouse);
    window.addEventListener("mouseleave", handlePointerLeave);
    window.addEventListener("touchmove", handleTouch, { passive: true });
    window.addEventListener("touchend", handlePointerLeave);

    let time = Math.random() * 100;
    const anim = () => {
      time += 0.016;
      const w = window.innerWidth;
      const h = window.innerHeight;
      const my = mouseRef.current.y;

      ctx.clearRect(0, 0, w, h);
      drawLines(w, h, time, my);

      // droplets of data travelling along the curves
      for (const d of dropletsRef.current) {
        d.t += d.speed;
        if (d.t > 1.04) {
          d.t = -0.04;
          d.line = Math.floor(Math.random() * linesRef.current.length);
          continue;
        }
        const line = linesRef.current[d.line];
        if (!line) continue;
        const x = d.t * (w + 40) - 20;
        const y = yAt(line, x, h, time);
        for (let k = 0; k < 3; k++) {
          const tx = x - k * 9;
          if (tx < -20 || tx > w + 20) continue;
          const ty = yAt(line, tx, h, time);
          const alpha = 0.7 - k * 0.22;
          const r = 4.5 - k * 1.2;
          const grad = ctx.createRadialGradient(tx, ty, 0, tx, ty, r);
          grad.addColorStop(0, `rgba(37, 99, 235, ${alpha})`);
          grad.addColorStop(1, "transparent");
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(tx, ty, r, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = "rgba(37, 99, 235, 0.9)";
        ctx.beginPath();
        ctx.arc(x, y, 1.8, 0, Math.PI * 2);
        ctx.fill();
      }

      animRef.current = requestAnimationFrame(anim);
    };
    animRef.current = requestAnimationFrame(anim);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMouse);
      window.removeEventListener("mouseleave", handlePointerLeave);
      window.removeEventListener("touchmove", handleTouch);
      window.removeEventListener("touchend", handlePointerLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: 0,
        pointerEvents: "none",
        background: "transparent",
      }}
    />
  );
}
