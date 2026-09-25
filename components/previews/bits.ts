import { INK, monoFont, type Sketch } from "./types";

// Rule 30: a row of switches, one tiny rule, and complexity emerges — a fitting
// thumbnail for a history of computing. Hovering flips switches in the newest row.

const RULE = 30;
const INTERVAL = 0.085;

export function create(ctx: CanvasRenderingContext2D): Sketch {
  let width = 1;
  let height = 1;
  let cell = 10;
  let cols = 1;
  let rowCount = 1;
  let rows: Uint8Array[] = [];
  let timer = 0;
  let generation = 0;
  let pointerX: number | null = null;
  const font = monoFont(11);

  function nextRow(prev: Uint8Array) {
    const next = new Uint8Array(cols);
    for (let i = 0; i < cols; i += 1) {
      const l = prev[(i - 1 + cols) % cols];
      const c = prev[i];
      const r = prev[(i + 1) % cols];
      next[i] = (RULE >> ((l << 2) | (c << 1) | r)) & 1;
    }
    return next;
  }

  function seed() {
    const first = new Uint8Array(cols);
    first[cols >> 1] = 1;
    rows = [first];
    while (rows.length < rowCount) rows.push(nextRow(rows[rows.length - 1]));
    generation = rowCount;
  }

  return {
    resize(nextWidth, nextHeight) {
      width = nextWidth;
      height = nextHeight;
      cell = Math.max(7, Math.round(width / 64));
      cols = Math.ceil(width / cell);
      rowCount = Math.ceil(height / cell) + 2;
      seed();
    },
    pointer(x) {
      pointerX = x;
    },
    step(dt) {
      timer += dt;
      while (timer >= INTERVAL) {
        timer -= INTERVAL;
        const next = nextRow(rows[rows.length - 1]);
        if (pointerX !== null) {
          const col = Math.floor(pointerX / cell);
          if (col >= 0 && col < cols && Math.random() < 0.7) next[col] ^= 1;
        }
        rows.push(next);
        if (rows.length > rowCount) rows.shift();
        generation += 1;
        const alive = next.reduce((sum, v) => sum + v, 0);
        if (alive === 0 || alive === cols || generation > 4000) seed();
      }
    },
    draw() {
      ctx.fillStyle = INK.bg;
      ctx.fillRect(0, 0, width, height);
      const offset = (timer / INTERVAL) * cell;
      const size = cell - 2.5;
      const last = rows.length - 1;
      for (let r = 0; r <= last; r += 1) {
        const y = height - (last - r) * cell - cell + (cell - offset) - 1;
        if (y < -cell || y > height) continue;
        const age = last - r;
        const row = rows[r];
        if (age === 0) {
          ctx.fillStyle = INK.ember;
          ctx.shadowColor = "rgba(255, 106, 43, 0.9)";
          ctx.shadowBlur = 10;
        } else {
          ctx.shadowBlur = 0;
          const fade = Math.max(0.08, 1 - age / (rowCount * 0.95));
          ctx.fillStyle = age < 4 ? `rgba(255, 182, 92, ${0.35 + fade * 0.5})` : `rgba(243, 237, 228, ${fade * 0.55})`;
        }
        for (let c = 0; c < cols; c += 1) {
          if (row[c]) ctx.fillRect(c * cell + 1.25, y, size, size);
        }
      }
      ctx.shadowBlur = 0;
      ctx.font = font;
      const label = `rule ${RULE} · gen ${generation}`;
      ctx.fillStyle = INK.bg;
      ctx.fillRect(10, 10, ctx.measureText(label).width + 12, 22);
      ctx.fillStyle = "rgba(243, 237, 228, 0.55)";
      ctx.fillText(label, 16, 24);
    },
  };
}
