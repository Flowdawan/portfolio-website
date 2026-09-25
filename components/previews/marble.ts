import { INK, monoFont, type Sketch } from "./types";

// Marbles tumbling through a peg board. Each row is a pentatonic note, so a hit
// flashes that row's colour — a silent nod to the real, audible toy.

type Peg = { x: number; y: number; glow: number; row: number };
type Marble = { x: number; y: number; vx: number; vy: number; trail: number[]; tone: number };
type Ring = { x: number; y: number; life: number; row: number };

const NOTES = ["C", "D", "E", "G", "A"];
const TONES = ["#ffd9a0", "#ffb65c", "#ff8a3d", "#ff6a2b", "#e8431c", "#ffc98a", "#ff9a52"];
const MARBLE_R = 5.2;
const PEG_R = 3.2;
const GRAVITY = 820;

export function create(ctx: CanvasRenderingContext2D): Sketch {
  let width = 1;
  let height = 1;
  let pegs: Peg[] = [];
  let rows: Peg[][] = [];
  let marbles: Marble[] = [];
  let rings: Ring[] = [];
  let spawnTimer = 0;
  let pointerX: number | null = null;
  let top = 0;
  let gapY = 1;
  const font = monoFont(11);

  function layout() {
    const left = 34;
    const cols = Math.max(7, Math.round((width - left) / 52));
    const gapX = (width - left) / cols;
    const rowCount = 7;
    top = height * 0.2;
    gapY = (height * 0.68) / (rowCount - 1);
    pegs = [];
    rows = [];
    for (let r = 0; r < rowCount; r += 1) {
      const row: Peg[] = [];
      const offset = r % 2 ? gapX / 2 : 0;
      for (let c = 0; c <= cols; c += 1) {
        const x = left + c * gapX + offset + gapX / 4;
        if (x > width - 10) continue;
        const peg = { x, y: top + r * gapY, glow: 0, row: r };
        row.push(peg);
        pegs.push(peg);
      }
      rows.push(row);
    }
    marbles = [];
    rings = [];
  }

  function spawn(x?: number) {
    if (marbles.length > 18) return;
    marbles.push({
      x: Math.max(40, x ?? width * (0.2 + Math.random() * 0.6)),
      y: -10,
      vx: (Math.random() - 0.5) * 30,
      vy: 20,
      trail: [],
      tone: (Math.random() * TONES.length) | 0,
    });
  }

  function physics(dt: number) {
    for (const m of marbles) {
      m.vy += GRAVITY * dt;
      m.x += m.vx * dt;
      m.y += m.vy * dt;
      if (m.x < 30 + MARBLE_R) {
        m.x = 30 + MARBLE_R;
        m.vx = Math.abs(m.vx) * 0.6;
      } else if (m.x > width - MARBLE_R) {
        m.x = width - MARBLE_R;
        m.vx = -Math.abs(m.vx) * 0.6;
      }
      const r = Math.round((m.y - top) / gapY);
      for (let rr = r - 1; rr <= r + 1; rr += 1) {
        const row = rows[rr];
        if (!row) continue;
        for (const peg of row) {
          const dx = m.x - peg.x;
          const dy = m.y - peg.y;
          const dist = Math.hypot(dx, dy);
          const min = MARBLE_R + PEG_R;
          if (dist >= min || dist === 0) continue;
          const nx = dx / dist;
          const ny = dy / dist;
          m.x = peg.x + nx * min;
          m.y = peg.y + ny * min;
          const vn = m.vx * nx + m.vy * ny;
          if (vn < 0) {
            m.vx -= 1.55 * vn * nx;
            m.vy -= 1.55 * vn * ny;
            m.vx += (Math.random() - 0.5) * 40;
            if (peg.glow < 0.6 && Math.abs(vn) > 60) rings.push({ x: peg.x, y: peg.y, life: 1, row: peg.row });
            peg.glow = 1;
          }
        }
      }
    }
  }

  return {
    resize(nextWidth, nextHeight) {
      width = nextWidth;
      height = nextHeight;
      layout();
    },
    pointer(x) {
      pointerX = x;
    },
    warmup() {
      for (let i = 0; i < 160; i += 1) this.step(1 / 60);
    },
    step(dt) {
      spawnTimer -= dt;
      if (spawnTimer <= 0) {
        spawn(pointerX === null ? undefined : pointerX + (Math.random() - 0.5) * 16);
        spawnTimer = pointerX === null ? 0.45 : 0.16;
      }
      const sub = 3;
      for (let i = 0; i < sub; i += 1) physics(dt / sub);
      for (const m of marbles) {
        m.trail.push(m.x, m.y);
        if (m.trail.length > 16) m.trail.splice(0, 2);
      }
      marbles = marbles.filter((m) => m.y < height + 30);
      for (const peg of pegs) peg.glow = Math.max(0, peg.glow - dt * 2.4);
      for (const ring of rings) ring.life -= dt * 1.6;
      rings = rings.filter((ring) => ring.life > 0);
    },
    draw() {
      ctx.fillStyle = INK.bg;
      ctx.fillRect(0, 0, width, height);

      for (const ring of rings) {
        ctx.strokeStyle = TONES[ring.row % TONES.length];
        ctx.globalAlpha = ring.life * 0.7;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(ring.x, ring.y, 4 + (1 - ring.life) * 26, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      for (const peg of pegs) {
        if (peg.glow > 0) {
          ctx.fillStyle = TONES[peg.row % TONES.length];
          ctx.globalAlpha = peg.glow * 0.35;
          ctx.beginPath();
          ctx.arc(peg.x, peg.y, PEG_R + 7 * peg.glow, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1;
        }
        ctx.fillStyle = peg.glow > 0.05 ? TONES[peg.row % TONES.length] : "rgba(243, 237, 228, 0.3)";
        ctx.beginPath();
        ctx.arc(peg.x, peg.y, PEG_R, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.lineCap = "round";
      for (const m of marbles) {
        const color = TONES[m.tone];
        for (let i = 2; i < m.trail.length; i += 2) {
          ctx.strokeStyle = color;
          ctx.globalAlpha = (i / m.trail.length) * 0.35;
          ctx.lineWidth = (i / m.trail.length) * MARBLE_R * 1.3;
          ctx.beginPath();
          ctx.moveTo(m.trail[i - 2], m.trail[i - 1]);
          ctx.lineTo(m.trail[i], m.trail[i + 1]);
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(m.x, m.y, MARBLE_R, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
        ctx.beginPath();
        ctx.arc(m.x - 1.6, m.y - 1.8, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.font = font;
      rows.forEach((row, index) => {
        ctx.fillStyle = TONES[index % TONES.length];
        ctx.globalAlpha = 0.28 + Math.max(...row.map((peg) => peg.glow)) * 0.72;
        ctx.fillText(NOTES[index % NOTES.length], 12, top + index * gapY + 4);
      });
      ctx.globalAlpha = 1;
      ctx.fillStyle = "rgba(243, 237, 228, 0.55)";
      ctx.fillText("pentatonic · 7 rows", 16, 24);
    },
  };
}
