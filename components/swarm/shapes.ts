// Point clouds for the ember swarm. Every particle gets one position per form,
// generated once on the CPU; the vertex shader blends between them.
//
//  0  neural   a small network: particles stream along its edges (A → B)
//  1  code     "</>" built from thick strokes
//  2  pipeline an infinity loop, evaluated analytically in the shader so the
//              particles can flow around it
//  3  shield   an outline with a slight dome and a lock in the middle
//
// Coordinates are in a unit space of roughly [-1.2, 1.2] with y pointing up.

export type SwarmGeometry = {
  count: number;
  /** delay, seed, size, phase */
  rand: Float32Array;
  /** neural edge start (xyz) + flow speed */
  neuralA: Float32Array;
  /** neural edge end (xyz) + 1 for edge particles, 0 for node particles */
  neuralB: Float32Array;
  code: Float32Array;
  shield: Float32Array;
  /** loop parameter, tube radius, tube angle, node flag */
  pipe: Float32Array;
};

type Vec2 = [number, number];

/** Small deterministic PRNG so every visit builds the same sculpture. */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Samples points evenly by length along a set of polylines. */
function strokeSampler(lines: Vec2[][]) {
  const segments: Array<{ a: Vec2; b: Vec2; start: number; length: number }> = [];
  let total = 0;
  for (const line of lines) {
    for (let i = 0; i < line.length - 1; i += 1) {
      const a = line[i];
      const b = line[i + 1];
      const length = Math.hypot(b[0] - a[0], b[1] - a[1]);
      segments.push({ a, b, start: total, length });
      total += length;
    }
  }
  return (u: number): Vec2 => {
    const target = u * total;
    let lo = 0;
    let hi = segments.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (segments[mid].start <= target) lo = mid;
      else hi = mid - 1;
    }
    const s = segments[lo];
    const t = s.length > 0 ? (target - s.start) / s.length : 0;
    return [s.a[0] + (s.b[0] - s.a[0]) * t, s.a[1] + (s.b[1] - s.a[1]) * t];
  };
}

function bezier(p0: Vec2, p1: Vec2, p2: Vec2, p3: Vec2, steps = 24): Vec2[] {
  const out: Vec2[] = [];
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    const u = 1 - t;
    out.push([
      u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0],
      u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1],
    ]);
  }
  return out;
}

function arc(cx: number, cy: number, r: number, from: number, to: number, steps = 28): Vec2[] {
  const out: Vec2[] = [];
  for (let i = 0; i <= steps; i += 1) {
    const a = from + ((to - from) * i) / steps;
    out.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
  }
  return out;
}

export function buildSwarm(count: number): SwarmGeometry {
  const rnd = mulberry32(2001);
  const gauss = () => (rnd() + rnd() + rnd() - 1.5) / 1.5;

  const rand = new Float32Array(count * 4);
  const neuralA = new Float32Array(count * 4);
  const neuralB = new Float32Array(count * 4);
  const code = new Float32Array(count * 3);
  const shield = new Float32Array(count * 3);
  const pipe = new Float32Array(count * 4);

  // ---- Neural network ------------------------------------------------------
  const layerSizes = [3, 5, 6, 5, 2];
  const nodes: Array<[number, number, number]> = [];
  const layers: number[][] = [];
  layerSizes.forEach((size, layer) => {
    const x = -1.15 + (2.3 * layer) / (layerSizes.length - 1);
    const ids: number[] = [];
    for (let i = 0; i < size; i += 1) {
      const y = size === 1 ? 0 : -0.82 + (1.64 * i) / (size - 1);
      // A gentle arc in depth makes the network read as an object, not a diagram.
      const z = (rnd() - 0.5) * 0.5 + Math.cos((y / 0.82) * 1.2) * 0.18;
      ids.push(nodes.length);
      nodes.push([x, y * (0.72 + 0.28 * (size / 6)), z]);
    }
    layers.push(ids);
  });
  const edges: Array<[number, number]> = [];
  for (let l = 0; l < layers.length - 1; l += 1) {
    for (const a of layers[l]) for (const b of layers[l + 1]) edges.push([a, b]);
  }

  // ---- "</>" -----------------------------------------------------------------
  const codeStroke = strokeSampler([
    [
      [-0.55, 0.62],
      [-1.15, 0],
      [-0.55, -0.62],
    ],
    [
      [0.3, 0.92],
      [-0.3, -0.92],
    ],
    [
      [0.55, 0.62],
      [1.15, 0],
      [0.55, -0.62],
    ],
  ]);

  // ---- Shield + lock ---------------------------------------------------------
  const outline = [
    ...bezier([0, 1.02], [0.3, 0.86], [0.62, 0.92], [0.86, 0.84]),
    ...bezier([0.86, 0.84], [0.9, 0.2], [0.72, -0.52], [0, -1.08]),
    ...bezier([0, -1.08], [-0.72, -0.52], [-0.9, 0.2], [-0.86, 0.84]),
    ...bezier([-0.86, 0.84], [-0.62, 0.92], [-0.3, 0.86], [0, 1.02]),
  ];
  const shieldStroke = strokeSampler([outline]);
  const inner = outline.map(([x, y]) => [x * 0.82, y * 0.82 - 0.02] as Vec2);
  const innerStroke = strokeSampler([inner]);
  const lockStroke = strokeSampler([
    arc(0, 0.12, 0.2, 0, Math.PI, 30),
    [
      [-0.2, 0.12],
      [-0.2, 0.02],
    ],
    [
      [0.2, 0.12],
      [0.2, 0.02],
    ],
    [
      [-0.32, 0.02],
      [0.32, 0.02],
      [0.32, -0.42],
      [-0.32, -0.42],
      [-0.32, 0.02],
    ],
    arc(0, -0.16, 0.055, 0, Math.PI * 2, 16),
  ]);
  const dome = (x: number, y: number) => 0.22 * (1 - Math.min(1, (x * x) / 0.8 + (y * y) / 1.2));

  for (let i = 0; i < count; i += 1) {
    const r = rnd();
    rand[i * 4] = rnd(); // morph delay
    rand[i * 4 + 1] = rnd() * 100; // seed
    rand[i * 4 + 2] = r < 0.04 ? 2 + rnd() * 2.5 : Math.pow(rnd(), 2.2); // size class (>1: soft glow)
    rand[i * 4 + 3] = rnd(); // phase

    // Neural: 28 % sit on nodes, the rest stream along edges.
    if (rnd() < 0.28) {
      const n = nodes[Math.floor(rnd() * nodes.length)];
      const rr = 0.07 * Math.cbrt(rnd());
      const th = rnd() * Math.PI * 2;
      const ph = Math.acos(2 * rnd() - 1);
      const x = n[0] + rr * Math.sin(ph) * Math.cos(th);
      const y = n[1] + rr * Math.sin(ph) * Math.sin(th);
      const z = n[2] + rr * Math.cos(ph);
      neuralA.set([x, y, z, 0], i * 4);
      neuralB.set([x, y, z, 0], i * 4);
    } else {
      const [a, b] = edges[Math.floor(rnd() * edges.length)];
      const j = 0.012;
      neuralA.set([nodes[a][0] + gauss() * j, nodes[a][1] + gauss() * j, nodes[a][2] + gauss() * j, 0.6 + rnd() * 0.8], i * 4);
      neuralB.set([nodes[b][0] + gauss() * j, nodes[b][1] + gauss() * j, nodes[b][2] + gauss() * j, 1], i * 4);
    }

    // Code glyphs: thick, slightly extruded strokes.
    {
      const [x, y] = codeStroke(rnd());
      const rr = 0.085 * Math.sqrt(rnd());
      const th = rnd() * Math.PI * 2;
      code.set([x + Math.cos(th) * rr, y + Math.sin(th) * rr, (rnd() - 0.5) * 0.26], i * 3);
    }

    // Pipeline: 12 % cluster on four stations, the rest form the tube.
    {
      const node = rnd() < 0.12;
      const t = node ? (Math.floor(rnd() * 4) + 0.5) / 4 + gauss() * 0.006 : rnd();
      pipe.set([t, node ? 0.05 * Math.sqrt(rnd()) : 0.03 + 0.09 * Math.sqrt(rnd()), rnd() * Math.PI * 2, node ? 1 : 0], i * 4);
    }

    // Shield: outline 52 %, inner rim 14 %, lock 22 %, faint fill 12 %.
    {
      const pick = rnd();
      let x: number;
      let y: number;
      let z: number;
      if (pick < 0.52) {
        [x, y] = shieldStroke(rnd());
        const rr = 0.06 * Math.sqrt(rnd());
        const th = rnd() * Math.PI * 2;
        x += Math.cos(th) * rr;
        y += Math.sin(th) * rr;
        z = (rnd() - 0.5) * 0.14;
      } else if (pick < 0.66) {
        [x, y] = innerStroke(rnd());
        x += gauss() * 0.012;
        y += gauss() * 0.012;
        z = dome(x, y) * 0.6 + (rnd() - 0.5) * 0.04;
      } else if (pick < 0.88) {
        [x, y] = lockStroke(rnd());
        const rr = 0.04 * Math.sqrt(rnd());
        const th = rnd() * Math.PI * 2;
        x += Math.cos(th) * rr;
        y += Math.sin(th) * rr;
        z = dome(x, y) + 0.06 + (rnd() - 0.5) * 0.08;
      } else {
        // Rejection-sample the inside of the shield.
        do {
          x = (rnd() - 0.5) * 1.6;
          y = rnd() * 2 - 1.05;
        } while (Math.abs(x) > 0.82 * Math.min(1, (y + 1.08) / 1.3) + (y > 0.1 ? 0.04 : 0) || y > 0.84);
        z = dome(x, y) - 0.05;
      }
      shield.set([x, y, z], i * 3);
    }
  }

  return { count, rand, neuralA, neuralB, code, shield, pipe };
}
