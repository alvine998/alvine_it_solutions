import { useEffect, useRef, useCallback } from "react";

interface Node {
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  vx: number;
  vy: number;
  radius: number;
  hue: number;
}

interface Edge {
  a: number;
  b: number;
}

interface Signal {
  edge: number;
  progress: number;
  speed: number;
  color: string;
}

const isMobile = () =>
  typeof window !== "undefined" && window.innerWidth < 860;

const NODE_COUNT_DESKTOP = 70;
const NODE_COUNT_MOBILE = 32;
const MAX_EDGE_DIST_DESKTOP = 180;
const MAX_EDGE_DIST_MOBILE = 120;
const MOUSE_REPEL_RADIUS = 140;
const MOUSE_LIGHT_RADIUS = 200;
const SIGNAL_COUNT_DESKTOP = 12;
const SIGNAL_COUNT_MOBILE = 6;
const REPEL_FORCE = 0.3;
const DAMPING = 0.92;
const RETURN_SPEED = 0.015;

const COLORS = [
  { hl: "#6366f1", sh: "#8b5cf6" },
  { hl: "#8b5cf6", sh: "#a78bfa" },
  { hl: "#06b6d4", sh: "#6366f1" },
  { hl: "#a78bfa", sh: "#ec4899" },
];

export default function Scene3D() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nodesRef = useRef<Node[]>([]);
  const edgesRef = useRef<Edge[]>([]);
  const signalsRef = useRef<Signal[]>([]);
  const mouseRef = useRef({ x: -9999, y: -9999 });
  const maxEdgeDistRef = useRef(MAX_EDGE_DIST_DESKTOP);
  const animRef = useRef(0);

  const init = useCallback((width: number, height: number) => {
    const mobile = isMobile();
    const nodeCount = mobile ? NODE_COUNT_MOBILE : NODE_COUNT_DESKTOP;
    const maxEdgeDist = mobile ? MAX_EDGE_DIST_MOBILE : MAX_EDGE_DIST_DESKTOP;
    maxEdgeDistRef.current = maxEdgeDist;
    const signalCount = mobile ? SIGNAL_COUNT_MOBILE : SIGNAL_COUNT_DESKTOP;

    const nodes: Node[] = [];
    for (let i = 0; i < nodeCount; i++) {
      const x = 40 + Math.random() * (width - 80);
      const y = 40 + Math.random() * (height - 80);
      nodes.push({
        x,
        y,
        baseX: x,
        baseY: y,
        vx: 0,
        vy: 0,
        radius: 2 + Math.random() * 2.5,
        hue: Math.random(),
      });
    }
    nodesRef.current = nodes;

    const edges: Edge[] = [];
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[i].x - nodes[j].x;
        const dy = nodes[i].y - nodes[j].y;
        if (dx * dx + dy * dy < maxEdgeDist * maxEdgeDist) {
          edges.push({ a: i, b: j });
        }
      }
    }
    edgesRef.current = edges;

    const signals: Signal[] = [];
    for (let i = 0; i < signalCount; i++) {
      signals.push({
        edge: Math.floor(Math.random() * edges.length),
        progress: Math.random(),
        speed: 0.002 + Math.random() * 0.006,
        color: COLORS[i % COLORS.length].hl,
      });
    }
    signalsRef.current = signals;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const mobile = isMobile();
    const dpr = Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 2);

    const resize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      init(w, h);
    };

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

    const anim = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;
      const nodes = nodesRef.current;
      const edges = edgesRef.current;
      const signals = signalsRef.current;

      /* ── physics update ──────────────────────────────────────── */
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        const dx = n.x - mx;
        const dy = n.y - my;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < MOUSE_REPEL_RADIUS && dist > 0.1) {
          const force = REPEL_FORCE * (1 - dist / MOUSE_REPEL_RADIUS);
          n.vx += (dx / dist) * force;
          n.vy += (dy / dist) * force;
        }

        n.vx += (n.baseX - n.x) * RETURN_SPEED;
        n.vy += (n.baseY - n.y) * RETURN_SPEED;
        n.vx *= DAMPING;
        n.vy *= DAMPING;
        n.x += n.vx;
        n.y += n.vy;

        if (n.x < -50) n.x = w + 50;
        if (n.x > w + 50) n.x = -50;
        if (n.y < -50) n.y = h + 50;
        if (n.y > h + 50) n.y = -50;
      }

      /* ── draw ────────────────────────────────────────────────── */
      ctx.clearRect(0, 0, w, h);

      /* edges */
      for (let ei = 0; ei < edges.length; ei++) {
        const e = edges[ei];
        const a = nodes[e.a];
        const b = nodes[e.b];
        const edx = a.x - b.x;
        const edy = a.y - b.y;
        const edist = Math.sqrt(edx * edx + edy * edy);
        const baseAlpha = 0.06 + 0.06 * (1 - edist / maxEdgeDistRef.current);

        /* glow from nearby signals on this edge */
        let signalGlow = 0;
        for (const s of signals) {
          if (s.edge === ei) {
            const d = Math.abs(s.progress - 0.5) * 2;
            signalGlow = Math.max(signalGlow, 1 - d);
          }
        }

        const alpha = baseAlpha + signalGlow * 0.2;
        ctx.strokeStyle = `rgba(99, 102, 241, ${alpha})`;
        ctx.lineWidth = 0.8 + signalGlow * 1.5;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }

      /* signals */
      for (const s of signals) {
        s.progress += s.speed;
        if (s.progress > 1) s.progress -= 1;

        const e = edges[s.edge];
        if (!e) continue;
        const a = nodes[e.a];
        const b = nodes[e.b];
        const sx = a.x + (b.x - a.x) * s.progress;
        const sy = a.y + (b.y - a.y) * s.progress;

        const grad = ctx.createRadialGradient(sx, sy, 0, sx, sy, 6);
        grad.addColorStop(0, s.color);
        grad.addColorStop(0.4, s.color);
        grad.addColorStop(1, "transparent");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(sx, sy, 6, 0, Math.PI * 2);
        ctx.fill();
      }

      /* nodes */
      for (const n of nodes) {
        const ndx = n.x - mx;
        const ndy = n.y - my;
        const ndist = Math.sqrt(ndx * ndx + ndy * ndy);
        const lightFactor = ndist < MOUSE_LIGHT_RADIUS
          ? 1 - ndist / MOUSE_LIGHT_RADIUS
          : 0;

        const baseAlpha = 0.5 + lightFactor * 0.5;
        const r = n.radius * (1 + lightFactor * 0.8);

        const grad = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, r * 3);
        grad.addColorStop(0, `rgba(139, 92, 246, ${baseAlpha})`);
        grad.addColorStop(0.5, `rgba(99, 102, 241, ${baseAlpha * 0.5})`);
        grad.addColorStop(1, "transparent");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(n.x, n.y, r * 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = `rgba(255, 255, 255, ${0.7 + lightFactor * 0.3})`;
        ctx.beginPath();
        ctx.arc(n.x, n.y, r * 0.6, 0, Math.PI * 2);
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
  }, [init]);

  return (
    <canvas
      ref={canvasRef}
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
