import { createNoise2D } from "@/lib/noise";
import { INK, monoFont, type Sketch } from "./types";

// Ink particles advected through a slowly shifting noise field, painted with
// long fading trails. The pointer adds a vortex you can stir the ink with.

const COLORS = ["rgba(255, 106, 43, 0.5)", "rgba(255, 182, 92, 0.42)", "rgba(243, 237, 228, 0.3)"];

export function create(ctx: CanvasRenderingContext2D): Sketch {
  const noise = createNoise2D(11);
  let width = 1;
  let height = 1;
  let time = 0;
  let count = 0;
  let xs = new Float32Array(0);
  let ys = new Float32Array(0);
  let pxs = new Float32Array(0);
  let pys = new Float32Array(0);
  let ages = new Float32Array(0);
  let lives = new Float32Array(0);
  let pointer: { x: number; y: number; vx: number; vy: number } | null = null;
  const font = monoFont(11);

  function respawn(i: number) {
    xs[i] = Math.random() * width;
    ys[i] = Math.random() * height;
    pxs[i] = xs[i];
    pys[i] = ys[i];
    ages[i] = 0;
    lives[i] = 2 + Math.random() * 5;
  }

  function clear() {
    ctx.fillStyle = INK.bg;
    ctx.fillRect(0, 0, width, height);
  }

  return {
    resize(nextWidth, nextHeight) {
      width = nextWidth;
      height = nextHeight;
      count = Math.round(Math.min(1400, (width * height) / 190));
      xs = new Float32Array(count);
      ys = new Float32Array(count);
      pxs = new Float32Array(count);
      pys = new Float32Array(count);
      ages = new Float32Array(count);
      lives = new Float32Array(count);
      for (let i = 0; i < count; i += 1) {
        respawn(i);
        ages[i] = Math.random() * lives[i];
      }
      clear();
    },
    pointer(x, y) {
      if (x === null || y === undefined) {
        pointer = null;
        return;
      }
      pointer = pointer ? { x, y, vx: x - pointer.x, vy: y - pointer.y } : { x, y, vx: 0, vy: 0 };
    },
    warmup() {
      for (let i = 0; i < 150; i += 1) {
        this.step(1 / 60);
        this.draw();
      }
    },
    step(dt) {
      time += dt;
      const radius = 110;
      for (let i = 0; i < count; i += 1) {
        const x = xs[i];
        const y = ys[i];
        const angle = noise(x * 0.0028 + time * 0.04, y * 0.0028 - time * 0.03) * Math.PI * 2.4;
        let vx = Math.cos(angle) * 38;
        let vy = Math.sin(angle) * 38;
        if (pointer) {
          const dx = x - pointer.x;
          const dy = y - pointer.y;
          const dist = Math.hypot(dx, dy);
          if (dist < radius && dist > 0.01) {
            const f = 1 - dist / radius;
            vx += (-dy / dist) * 240 * f + pointer.vx * 6 * f;
            vy += (dx / dist) * 240 * f + pointer.vy * 6 * f;
          }
        }
        pxs[i] = x;
        pys[i] = y;
        xs[i] = x + vx * dt;
        ys[i] = y + vy * dt;
        ages[i] += dt;
        if (ages[i] > lives[i] || xs[i] < -5 || xs[i] > width + 5 || ys[i] < -5 || ys[i] > height + 5) respawn(i);
      }
      if (pointer) {
        pointer.vx *= 0.8;
        pointer.vy *= 0.8;
      }
    },
    draw() {
      ctx.fillStyle = "rgba(16, 13, 11, 0.065)";
      ctx.fillRect(0, 0, width, height);
      ctx.lineWidth = 1.1;
      ctx.lineCap = "round";
      for (let bucket = 0; bucket < COLORS.length; bucket += 1) {
        ctx.strokeStyle = COLORS[bucket];
        ctx.beginPath();
        for (let i = bucket; i < count; i += COLORS.length) {
          if (ages[i] < 0.05) continue;
          ctx.moveTo(pxs[i], pys[i]);
          ctx.lineTo(xs[i], ys[i]);
        }
        ctx.stroke();
      }
      ctx.font = font;
      const label = `${count} particles · noise flow`;
      ctx.fillStyle = INK.bg;
      ctx.fillRect(10, 10, ctx.measureText(label).width + 12, 22);
      ctx.fillStyle = "rgba(243, 237, 228, 0.55)";
      ctx.fillText(label, 16, 24);
    },
  };
}
