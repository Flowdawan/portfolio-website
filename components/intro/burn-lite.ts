import { FRONT_SAMPLES, type BurnFrame, type BurnRenderer } from "./burn-renderer";

// Canvas 2D stand-in for the shader fire, used when WebGL runs on a CPU
// rasteriser (or is unavailable): a charred, glowing seam along the exact same
// burn front plus additive sparks. A handful of path strokes per frame instead
// of a full-screen fragment shader keeps it fluid without a GPU.

const COS = new Float32Array(FRONT_SAMPLES);
const SIN = new Float32Array(FRONT_SAMPLES);
for (let k = 0; k < FRONT_SAMPLES; k += 1) {
  const angle = -Math.PI + (Math.PI * 2 * k) / FRONT_SAMPLES;
  COS[k] = Math.cos(angle);
  SIN[k] = Math.sin(angle);
}

const SEAM: Array<[string, number]> = [
  ["rgba(255, 84, 20, 0.45)", 14],
  ["rgba(255, 170, 90, 0.8)", 5],
  ["rgba(255, 244, 220, 0.95)", 1.6],
];

export function createBurnLite(canvas: HTMLCanvasElement): BurnRenderer | null {
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  let width = 1;
  let height = 1;

  const emberColor = (heat: number) => {
    if (heat > 0.75) return "rgba(255, 238, 200, 0.95)";
    if (heat > 0.45) return "rgba(255, 150, 60, 0.9)";
    return `rgba(210, 60, 20, ${Math.max(0.15, heat * 1.6).toFixed(2)})`;
  };

  return {
    software: true,
    resize(nextWidth, nextHeight, dpr) {
      width = nextWidth;
      height = nextHeight;
      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    },
    render(frame: BurnFrame) {
      ctx.clearRect(0, 0, width, height);

      if (frame.drawBurn) {
        const path = new Path2D();
        for (let k = 0; k < FRONT_SAMPLES; k += 1) {
          const x = frame.cx + COS[k] * frame.front[k];
          const y = frame.cy + SIN[k] * frame.front[k];
          if (k === 0) path.moveTo(x, y);
          else path.lineTo(x, y);
        }
        path.closePath();
        ctx.lineJoin = "round";
        ctx.strokeStyle = "rgba(70, 30, 10, 0.5)";
        ctx.lineWidth = 42;
        ctx.stroke(path);
        ctx.strokeStyle = "#140b07";
        ctx.lineWidth = 16;
        ctx.stroke(path);
        ctx.globalCompositeOperation = "lighter";
        const flicker = 0.85 + 0.15 * Math.sin(frame.time * 23) * Math.sin(frame.time * 7);
        ctx.globalAlpha = flicker;
        for (const [color, lineWidth] of SEAM) {
          ctx.strokeStyle = color;
          ctx.lineWidth = lineWidth;
          ctx.stroke(path);
        }
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = "source-over";
      }

      if (frame.flare > 0.01) {
        const radius = 30 + 150 * frame.flare;
        const glow = ctx.createRadialGradient(frame.cx, frame.cy, 0, frame.cx, frame.cy, radius);
        glow.addColorStop(0, `rgba(255, 220, 160, ${frame.flare})`);
        glow.addColorStop(1, "rgba(255, 90, 20, 0)");
        ctx.fillStyle = glow;
        ctx.fillRect(frame.cx - radius, frame.cy - radius, radius * 2, radius * 2);
      }

      if (frame.emberCount > 0) {
        ctx.globalCompositeOperation = "lighter";
        for (let i = 0; i < frame.emberCount; i += 1) {
          const o = i * 4;
          const size = Math.max(1, frame.embers[o + 2] * 0.7);
          ctx.fillStyle = emberColor(frame.embers[o + 3]);
          ctx.fillRect(frame.embers[o] - size / 2, frame.embers[o + 1] - size / 2, size, size);
        }
        ctx.globalCompositeOperation = "source-over";
      }
    },
    destroy() {
      ctx.clearRect(0, 0, width, height);
    },
  };
}
