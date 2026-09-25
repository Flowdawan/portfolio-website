import { INK, monoFont, type Sketch } from "./types";

// A single neuron learning a linear boundary with the classic perceptron rule.
// Every few seconds the data changes and it has to re-learn from where it is.

type Point = { x: number; y: number; label: 1 | -1; flash: number; born: number };

export function create(ctx: CanvasRenderingContext2D): Sketch {
  let width = 1;
  let height = 1;
  let scale = 1;
  let time = 0;
  let points: Point[] = [];
  const weights = [0.35, -0.9];
  let bias = 0.1;
  const shown = [0.35, -0.9, 0.1];
  let timer = 0;
  let hold = 0;
  let epoch = 0;
  let probe: { x: number; y: number } | null = null;
  const font = monoFont(11);
  const rate = 0.2;

  const px = (x: number) => width / 2 + x * scale;
  const py = (y: number) => height / 2 - y * scale;
  const predict = (x: number, y: number) => (weights[0] * x + weights[1] * y + bias >= 0 ? 1 : -1);

  function newEpisode() {
    const angle = Math.random() * Math.PI * 2;
    const nx = Math.cos(angle);
    const ny = Math.sin(angle);
    const offset = (Math.random() - 0.5) * 0.35;
    const xRange = (width / 2 / scale) * 0.9;
    points = [];
    let guard = 0;
    while (points.length < 40 && guard < 2000) {
      guard += 1;
      const x = (Math.random() * 2 - 1) * xRange;
      const y = (Math.random() * 2 - 1) * 0.9;
      const side = nx * x + ny * y + offset;
      if (Math.abs(side) < 0.12) continue;
      points.push({ x, y, label: side > 0 ? 1 : -1, flash: 0, born: time + points.length * 0.012 });
    }
    epoch = 0;
  }

  function accuracy() {
    if (!points.length) return 0;
    return points.filter((p) => predict(p.x, p.y) === p.label).length / points.length;
  }

  return {
    resize(nextWidth, nextHeight) {
      width = nextWidth;
      height = nextHeight;
      scale = Math.min(width, height) * 0.42;
      newEpisode();
    },
    pointer(x, y) {
      probe = x === null || y === undefined ? null : { x, y };
    },
    warmup() {
      for (let i = 0; i < 40; i += 1) this.step(0.1);
    },
    step(dt) {
      time += dt;
      timer += dt;
      for (const point of points) point.flash = Math.max(0, point.flash - dt * 2.2);
      if (hold > 0) {
        hold -= dt;
        if (hold <= 0) newEpisode();
      } else if (timer > 0.11) {
        timer = 0;
        const wrong = points.filter((p) => predict(p.x, p.y) !== p.label);
        if (!wrong.length) {
          hold = 1.8;
        } else {
          const p = wrong[(Math.random() * wrong.length) | 0];
          weights[0] += rate * p.label * p.x;
          weights[1] += rate * p.label * p.y;
          bias += rate * p.label;
          p.flash = 1;
          epoch += 1;
        }
      }
      const k = 1 - Math.exp(-dt * 9);
      shown[0] += (weights[0] - shown[0]) * k;
      shown[1] += (weights[1] - shown[1]) * k;
      shown[2] += (bias - shown[2]) * k;
    },
    draw() {
      ctx.fillStyle = INK.bg;
      ctx.fillRect(0, 0, width, height);

      const [w0, w1, b] = shown;
      const norm = Math.hypot(w0, w1) || 1;
      const nx = w0 / norm;
      const ny = w1 / norm;
      // Boundary: n·p + b/|w| = 0 → closest point to origin is -b/|w| · n
      const cx = -(b / norm) * nx;
      const cy = -(b / norm) * ny;
      const far = 40;
      const ax = px(cx - ny * far);
      const ay = py(cy + nx * far);
      const bx = px(cx + ny * far);
      const by = py(cy - nx * far);
      const sx = nx * scale * far;
      const sy = -ny * scale * far;

      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(bx, by);
      ctx.lineTo(bx + sx, by + sy);
      ctx.lineTo(ax + sx, ay + sy);
      ctx.closePath();
      ctx.fillStyle = "rgba(255, 106, 43, 0.075)";
      ctx.fill();

      ctx.fillStyle = "rgba(243, 237, 228, 0.07)";
      const step = Math.max(18, Math.round(scale / 7));
      for (let gx = (width / 2) % step; gx < width; gx += step) {
        for (let gy = (height / 2) % step; gy < height; gy += step) ctx.fillRect(gx - 0.75, gy - 0.75, 1.5, 1.5);
      }

      ctx.lineCap = "round";
      ctx.strokeStyle = "rgba(255, 106, 43, 0.22)";
      ctx.lineWidth = 7;
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(bx, by);
      ctx.stroke();
      ctx.strokeStyle = INK.ember;
      ctx.lineWidth = 1.6;
      ctx.stroke();

      // Weight vector from the origin.
      const ox = px(0);
      const oy = py(0);
      const tipX = px(nx * 0.34);
      const tipY = py(ny * 0.34);
      ctx.strokeStyle = INK.amber;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(ox, oy);
      ctx.lineTo(tipX, tipY);
      ctx.stroke();
      const head = Math.atan2(tipY - oy, tipX - ox);
      ctx.beginPath();
      ctx.moveTo(tipX, tipY);
      ctx.lineTo(tipX - Math.cos(head - 0.45) * 8, tipY - Math.sin(head - 0.45) * 8);
      ctx.lineTo(tipX - Math.cos(head + 0.45) * 8, tipY - Math.sin(head + 0.45) * 8);
      ctx.closePath();
      ctx.fillStyle = INK.amber;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(ox, oy, 2.5, 0, Math.PI * 2);
      ctx.fill();

      for (const point of points) {
        const appear = Math.min(1, Math.max(0, (time - point.born) * 5));
        if (appear <= 0) continue;
        const x = px(point.x);
        const y = py(point.y);
        const r = 4.2 * appear;
        ctx.globalAlpha = appear;
        if (point.label === 1) {
          ctx.fillStyle = INK.ember;
          ctx.beginPath();
          ctx.arc(x, y, r, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.strokeStyle = INK.bone;
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.arc(x, y, r, 0, Math.PI * 2);
          ctx.stroke();
        }
        if (point.flash > 0) {
          ctx.globalAlpha = point.flash;
          ctx.strokeStyle = INK.amber;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(x, y, r + 14 * (1 - point.flash), 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
      }

      if (probe) {
        const x = (probe.x - width / 2) / scale;
        const y = -(probe.y - height / 2) / scale;
        const positive = predict(x, y) === 1;
        ctx.strokeStyle = positive ? INK.ember : INK.bone;
        ctx.lineWidth = 1.2;
        ctx.setLineDash([3, 4]);
        ctx.beginPath();
        ctx.arc(probe.x, probe.y, 14, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.font = font;
        ctx.fillStyle = positive ? INK.ember : INK.bone;
        ctx.fillText(positive ? "class +1" : "class −1", probe.x + 20, probe.y + 4);
      }

      ctx.font = font;
      ctx.fillStyle = "rgba(243, 237, 228, 0.55)";
      ctx.fillText(`epoch ${String(epoch).padStart(3, "0")}`, 16, 24);
      ctx.fillText(`accuracy ${Math.round(accuracy() * 100)}%`, 16, 40);
      ctx.fillStyle = hold > 0 ? INK.amber : "rgba(243, 237, 228, 0.35)";
      ctx.fillText(hold > 0 ? "converged ✓" : "learning…", 16, 56);
    },
  };
}
