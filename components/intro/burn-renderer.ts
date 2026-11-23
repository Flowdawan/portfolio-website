import { createProgramAsync, GLSL_NOISE, uniforms } from "@/lib/gl";

// Renders the fire on top of the 2001 page. The burn front itself is computed on
// the CPU (see BurnIntro) as a radius per angle around the ignition point and
// uploaded as a 1D float texture — the same table also clips the DOM, so the hole
// in the old page and the charred edge drawn here always line up exactly.
//
// Before the fire is lit the cursor is a burning glass: a focused point of
// light that browns the paper it rests on (an accumulated low-res scorch map),
// lets it smoke, and finally sets it alight.

export const FRONT_SAMPLES = 360;
/** Scorch map resolution: one cell per SCORCH_CELL css pixels. */
export const SCORCH_CELL = 6;
/** Floats per ash flake: x, y, size, heat, angle, flip, seed, alpha. */
export const FLAKE_STRIDE = 8;

const QUAD_VS = /* glsl */ `#version 300 es
in vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }`;

const BURN_FS = /* glsl */ `#version 300 es
precision highp float;
uniform vec2 uRes;
uniform float uDpr;
uniform vec2 uCenter;
uniform float uTime;
uniform float uFlare;
uniform float uIgnited;
uniform float uShock;
uniform vec2 uMouse;
uniform float uHeat;
uniform float uCharge;
uniform sampler2D uFront;
uniform sampler2D uScorch;
out vec4 outColor;
${GLSL_NOISE}
const float TAU = 6.28318530718;
const float N = ${FRONT_SAMPLES}.0;

float frontAt(float ang) {
  float f = (ang / TAU + 0.5) * N;
  float i0 = floor(f);
  float t = f - i0;
  int a = int(mod(i0, N));
  int b = int(mod(i0 + 1.0, N));
  return mix(texelFetch(uFront, ivec2(a, 0), 0).r, texelFetch(uFront, ivec2(b, 0), 0).r, t);
}

vec4 over(vec4 top, vec4 bottom) { return top + bottom * (1.0 - top.a); }

void main() {
  vec2 p = vec2(gl_FragCoord.x, uRes.y * uDpr - gl_FragCoord.y) / uDpr;
  float t = uTime;
  vec3 emit = vec3(0.0);
  vec4 col = vec4(0.0);

  // Distance to the burn front (> 0: paper that has not burned yet).
  vec2 d = p - uCenter;
  float dist = length(d);
  float s = 1e5;
  if (uIgnited > 0.5) s = dist - frontAt(atan(d.y, d.x));

  if (uFlare > 0.001) {
    emit += vec3(1.0, 0.7, 0.36) * exp(-dist / (22.0 + 110.0 * uFlare)) * uFlare * 1.7;
  }

  // A heat pulse races outwards from the ignition point across the paper.
  if (uShock >= 0.0 && uShock < 0.9 && s > 0.0) {
    float r = uShock * 1500.0;
    float ring = exp(-abs(dist - r) / (14.0 + 50.0 * uShock));
    emit += vec3(1.0, 0.55, 0.2) * ring * (1.0 - uShock / 0.9) * 0.32;
  }

  // ---- Burning glass: scorch marks and the focused light --------------------
  vec2 uv = p / uRes;
  float scorch = texture(uScorch, uv).r;
  if (s > 0.0 && scorch > 0.003) {
    float grain = snoise(p / 9.0) * 0.5 + 0.5;
    float sc = clamp(scorch * 1.25 + (grain - 0.5) * 0.3, 0.0, 1.0);
    float brown = smoothstep(0.02, 0.5, sc);
    float charred = smoothstep(0.55, 0.92, sc);
    vec3 c = mix(vec3(0.5, 0.31, 0.12), vec3(0.06, 0.035, 0.02), charred);
    float a = brown * mix(0.55, 0.96, charred);
    col = over(vec4(c * a, a), col);
    // Fresh char still glows in hairline cracks near the light.
    float near = exp(-length(p - uMouse) / 46.0) * uHeat;
    float crack = smoothstep(0.45, 0.8, snoise(p / 4.5 + vec2(0.0, t * 0.8)));
    emit += vec3(1.0, 0.34, 0.06) * crack * charred * near * 1.3;
  }

  if (uHeat > 0.002 && uIgnited < 0.5) {
    vec2 m = p - uMouse;
    float r2 = dot(m, m);
    float focus = 1.0 + uCharge * 1.6;
    float flick = 0.88 + 0.12 * sin(t * 31.0) * sin(t * 13.0);
    emit += vec3(1.0, 0.98, 0.9) * exp(-r2 / (9.0 * focus)) * 1.6 * uHeat;
    emit += vec3(1.0, 0.72, 0.35) * exp(-r2 / (240.0 * focus)) * 0.55 * uHeat * flick;
    emit += vec3(1.0, 0.36, 0.08) * exp(-sqrt(r2) / (30.0 + 40.0 * uCharge)) * 0.32 * uHeat;

    // Smoke curling up from the spot, more of it as the paper heats.
    float above = clamp(-m.y / 190.0, 0.0, 1.0);
    if (m.y < 8.0 && above < 1.0) {
      float w = 10.0 + 70.0 * above;
      float sway = 16.0 * sin(p.y / 38.0 + t * 1.6) * above;
      float band = exp(-pow((m.x - sway) / w, 2.0));
      float nz = snoise(vec2(p.x / 26.0, p.y / 34.0 + t * 1.3)) * 0.5 + 0.5;
      float a = band * smoothstep(0.35, 0.85, nz) * (1.0 - above) * (0.12 + 0.4 * uCharge) * uHeat;
      a *= smoothstep(8.0, -6.0, m.y);
      col = over(vec4(vec3(0.16, 0.14, 0.13) * a, a), col);
    }

    // Tiny flames start to lick up just before it catches.
    if (uCharge > 0.45) {
      float h = clamp(-m.y / (14.0 + 40.0 * uCharge), 0.0, 1.0);
      float w = exp(-pow(m.x / (6.0 + 9.0 * uCharge * (1.0 - h)), 2.0));
      float fz = fbm2(vec2(p.x / 9.0, p.y / 12.0 + t * 4.0)) * 0.5 + 0.5;
      float flame = w * smoothstep(h, h + 0.35, fz) * (1.0 - h) * step(m.y, 4.0);
      emit += mix(vec3(1.0, 0.9, 0.6), vec3(1.0, 0.36, 0.06), h) * flame * smoothstep(0.45, 1.0, uCharge) * 1.3;
    }
  }

  if (uIgnited < 0.5 || s > 290.0 || s < -120.0) {
    float ea = clamp(max(emit.r, max(emit.g, emit.b)), 0.0, 1.0);
    outColor = vec4(min(col.rgb + emit, vec3(1.0)), max(col.a, ea));
    return;
  }

  vec2 n = dist > 0.5 ? d / dist : vec2(0.0, -1.0);
  float facingUp = clamp(-n.y, 0.0, 1.0);
  float ang = atan(d.y, d.x);

  // Two noise lookups shape the whole edge: a broad one for the scorch and
  // char width, a fine one for the ragged inner rim.
  float broad = snoise(p / 64.0 + 3.7) * 0.5 + 0.5;
  float fine = snoise(p / 18.0) * 0.5 + 0.5;

  // Paper side: heat discolouration, then a deep scorch right before the flame.
  if (s > 0.0) {
    float scorchW = 28.0 + 54.0 * broad;
    float sc = pow(clamp(1.0 - s / scorchW, 0.0, 1.0), 1.45);
    float tint = pow(clamp(1.0 - s / (scorchW * 2.9), 0.0, 1.0), 2.0) * 0.34;
    vec3 brown = mix(vec3(0.44, 0.25, 0.1), vec3(0.07, 0.035, 0.018), sc);
    float a = max(sc * 0.97, tint);
    col = over(vec4(brown * a, a), col);
  }

  // Smoke curling up from the burning edge.
  float smokeZone = smoothstep(270.0, 50.0, s) * smoothstep(-40.0, 20.0, s);
  if (smokeZone > 0.0) {
    float sm = snoise(vec2(p.x / 120.0, p.y / 150.0 + t * 0.5)) * 0.5 + 0.5;
    float a = smokeZone * smoothstep(0.36, 0.95, sm) * 0.36 * (0.35 + 0.65 * facingUp);
    col = over(vec4(vec3(0.045, 0.04, 0.036) * a, a), col);
  }

  // Charred rim with a ragged inner edge.
  float charW = 8.0 + 12.0 * fine + 7.0 * broad;
  float charA = smoothstep(-charW - 1.5, -charW + 1.5, s) * (1.0 - smoothstep(0.0, 1.5, s));
  if (charA > 0.0) {
    col = over(vec4(vec3(0.05, 0.03, 0.022) * charA, charA), col);
  }

  float flick = 0.84 + 0.09 * sin(t * 17.0 + ang * 5.0) + 0.07 * sin(t * 29.0 - ang * 11.0);

  // The glowing seam where paper turns to ash.
  emit += vec3(1.0, 0.88, 0.6) * exp(-abs(s - 0.8) / 2.0) * 1.25 * flick;
  emit += vec3(1.0, 0.36, 0.07) * exp(-abs(s) / 15.0) * 0.6 * flick;

  // Embers still glowing inside the char.
  if (s < 1.0 && s > -charW - 3.0) {
    float crack = smoothstep(0.35, 0.75, snoise(p / 5.5 + vec2(0.0, t * 0.6)));
    emit += vec3(1.0, 0.32, 0.05) * crack * exp(s / 6.0) * 0.95;
  }

  // Warm light spilling onto the new page underneath.
  if (s < -charW) {
    emit += vec3(1.0, 0.3, 0.06) * exp((s + charW) / 24.0) * 0.2;
  }

  // Flames licking upwards — tallest where the edge faces up.
  float flameH = 22.0 + 125.0 * pow(facingUp, 1.3);
  if (s > -8.0 && s < flameH) {
    vec2 fp = vec2(p.x / 30.0 + 0.5 * sin(p.y / 70.0 + t * 1.4 + p.x / 110.0), p.y / 42.0 + t * 2.8);
    float fnz = fbm2(fp) * 0.5 + 0.5;
    float h = clamp(max(s, 0.0) / flameH, 0.0, 1.0);
    float flame = smoothstep(h * 0.9, h * 0.9 + 0.3, fnz) * (1.0 - h) * smoothstep(-8.0, 0.0, s);
    vec3 fc = mix(vec3(1.0, 0.92, 0.66), vec3(1.0, 0.48, 0.1), smoothstep(0.0, 0.45, h));
    fc = mix(fc, vec3(0.78, 0.12, 0.03), smoothstep(0.45, 1.0, h));
    emit += fc * flame * 1.15 * flick;
  }

  float ea = clamp(max(emit.r, max(emit.g, emit.b)), 0.0, 1.0);
  outColor = vec4(min(col.rgb + emit, vec3(1.0)), max(col.a, ea));
}`;

const EMBER_VS = /* glsl */ `#version 300 es
in vec4 aP; // x, y (css px), size (css px), heat 0..1
uniform vec2 uRes;
uniform float uDpr;
out float vHeat;
void main() {
  gl_Position = vec4(aP.x / uRes.x * 2.0 - 1.0, 1.0 - aP.y / uRes.y * 2.0, 0.0, 1.0);
  gl_PointSize = max(1.0, aP.z * uDpr);
  vHeat = aP.w;
}`;

const EMBER_FS = /* glsl */ `#version 300 es
precision mediump float;
in float vHeat;
out vec4 o;
void main() {
  vec2 q = gl_PointCoord * 2.0 - 1.0;
  float r2 = dot(q, q);
  if (r2 > 1.0) discard;
  vec3 c = mix(vec3(0.7, 0.1, 0.02), vec3(1.0, 0.5, 0.12), smoothstep(0.15, 0.55, vHeat));
  c = mix(c, vec3(1.0, 0.93, 0.75), smoothstep(0.72, 1.0, vHeat));
  float a = exp(-r2 * 4.0) * clamp(vHeat * 1.5, 0.0, 1.0);
  o = vec4(c * a, a);
}`;

// Ash flakes: torn scraps of burnt paper with a glowing rim that tumble upwards.
// Each is a point sprite; the fragment shader rotates it, squashes it by its
// flip (tumbling in 3D) and cuts a ragged outline from a few sines.
const FLAKE_VS = /* glsl */ `#version 300 es
in vec4 aA; // x, y, size, heat
in vec4 aB; // angle, flip, seed, alpha
uniform vec2 uRes;
uniform float uDpr;
out float vHeat;
out float vAngle;
out float vFlip;
out float vSeed;
out float vAlpha;
void main() {
  gl_Position = vec4(aA.x / uRes.x * 2.0 - 1.0, 1.0 - aA.y / uRes.y * 2.0, 0.0, 1.0);
  gl_PointSize = max(2.0, aA.z * uDpr);
  vHeat = aA.w;
  vAngle = aB.x;
  vFlip = aB.y;
  vSeed = aB.z;
  vAlpha = aB.w;
}`;

const FLAKE_FS = /* glsl */ `#version 300 es
precision mediump float;
in float vHeat;
in float vAngle;
in float vFlip;
in float vSeed;
in float vAlpha;
out vec4 o;
void main() {
  vec2 q = gl_PointCoord * 2.0 - 1.0;
  float c = cos(vAngle);
  float s = sin(vAngle);
  q = mat2(c, -s, s, c) * q;
  q.y /= max(0.12, abs(vFlip));
  float a = atan(q.y, q.x);
  float edge = 0.62 + 0.15 * sin(3.0 * a + vSeed) + 0.1 * sin(5.0 * a + vSeed * 2.3) + 0.06 * sin(9.0 * a + vSeed * 4.1);
  float r = length(q);
  float inside = 1.0 - smoothstep(edge - 0.06, edge, r);
  if (inside <= 0.001) discard;
  float rim = smoothstep(edge - 0.3, edge - 0.04, r);
  vec3 body = vec3(0.075, 0.055, 0.045) * (0.65 + 0.35 * vFlip * vFlip);
  vec3 glow = mix(vec3(0.85, 0.16, 0.03), vec3(1.0, 0.62, 0.22), vHeat);
  vec3 col = body + glow * rim * vHeat * 1.4;
  float alpha = inside * vAlpha;
  o = vec4(col * alpha, alpha);
}`;

export type BurnFrame = {
  time: number;
  cx: number;
  cy: number;
  flare: number;
  /** Seconds since ignition (negative before). */
  shock: number;
  ignited: boolean;
  front: Float32Array;
  drawBurn: boolean;
  embers: Float32Array;
  emberCount: number;
  flakes: Float32Array;
  flakeCount: number;
  mouseX: number;
  mouseY: number;
  /** Burning-glass intensity 0..1 (0 = no light on the page). */
  heat: number;
  /** How close the focused spot is to catching fire, 0..1. */
  charge: number;
  scorch: Uint8Array;
  scorchW: number;
  scorchH: number;
  scorchDirty: boolean;
};

export type BurnRenderer = {
  /** True on CPU rasterisers: callers should use a reduced resolution. */
  software: boolean;
  resize: (width: number, height: number, dpr: number) => void;
  render: (frame: BurnFrame) => void;
  destroy: () => void;
};

export async function createBurnRenderer(canvas: HTMLCanvasElement): Promise<BurnRenderer | null> {
  const gl = canvas.getContext("webgl2", {
    alpha: true,
    premultipliedAlpha: true,
    antialias: false,
    depth: false,
    stencil: false,
    powerPreference: "high-performance",
  });
  if (!gl) return null;

  let burnProgram: WebGLProgram;
  let emberProgram: WebGLProgram;
  let flakeProgram: WebGLProgram;
  try {
    [burnProgram, emberProgram, flakeProgram] = await Promise.all([
      createProgramAsync(gl, QUAD_VS, BURN_FS, 900),
      createProgramAsync(gl, EMBER_VS, EMBER_FS, 900),
      createProgramAsync(gl, FLAKE_VS, FLAKE_FS, 900),
    ]);
  } catch (error) {
    console.warn(error);
    return null;
  }

  const burnU = uniforms(gl, burnProgram, [
    "uRes",
    "uDpr",
    "uCenter",
    "uTime",
    "uFlare",
    "uIgnited",
    "uShock",
    "uMouse",
    "uHeat",
    "uCharge",
    "uFront",
    "uScorch",
  ] as const);
  const emberU = uniforms(gl, emberProgram, ["uRes", "uDpr"] as const);
  const flakeU = uniforms(gl, flakeProgram, ["uRes", "uDpr"] as const);

  const quadVao = gl.createVertexArray();
  gl.bindVertexArray(quadVao);
  const quad = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, quad);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const posLoc = gl.getAttribLocation(burnProgram, "aPos");
  gl.enableVertexAttribArray(posLoc);
  gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

  const emberVao = gl.createVertexArray();
  gl.bindVertexArray(emberVao);
  const emberBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, emberBuffer);
  const pLoc = gl.getAttribLocation(emberProgram, "aP");
  gl.enableVertexAttribArray(pLoc);
  gl.vertexAttribPointer(pLoc, 4, gl.FLOAT, false, 0, 0);

  const flakeVao = gl.createVertexArray();
  gl.bindVertexArray(flakeVao);
  const flakeBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, flakeBuffer);
  const aLoc = gl.getAttribLocation(flakeProgram, "aA");
  const bLoc = gl.getAttribLocation(flakeProgram, "aB");
  gl.enableVertexAttribArray(aLoc);
  gl.vertexAttribPointer(aLoc, 4, gl.FLOAT, false, FLAKE_STRIDE * 4, 0);
  gl.enableVertexAttribArray(bLoc);
  gl.vertexAttribPointer(bLoc, 4, gl.FLOAT, false, FLAKE_STRIDE * 4, 16);
  gl.bindVertexArray(null);

  const frontTexture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, frontTexture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.R32F, FRONT_SAMPLES, 1, 0, gl.RED, gl.FLOAT, new Float32Array(FRONT_SAMPLES));

  const scorchTexture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, scorchTexture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
  let scorchW = 0;
  let scorchH = 0;

  let width = 1;
  let height = 1;
  let ratio = 1;

  return {
    software: false,
    resize(nextWidth, nextHeight, dpr) {
      width = nextWidth;
      height = nextHeight;
      ratio = dpr;
      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));
      gl.viewport(0, 0, canvas.width, canvas.height);
    },
    render(frame) {
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      if (frame.drawBurn) {
        gl.disable(gl.BLEND);
        gl.useProgram(burnProgram);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, frontTexture);
        if (frame.ignited) gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, FRONT_SAMPLES, 1, gl.RED, gl.FLOAT, frame.front);
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, scorchTexture);
        if (frame.scorchW !== scorchW || frame.scorchH !== scorchH) {
          scorchW = frame.scorchW;
          scorchH = frame.scorchH;
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.R8, scorchW, scorchH, 0, gl.RED, gl.UNSIGNED_BYTE, frame.scorch);
        } else if (frame.scorchDirty) {
          gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, scorchW, scorchH, gl.RED, gl.UNSIGNED_BYTE, frame.scorch);
        }
        gl.uniform2f(burnU.uRes, width, height);
        gl.uniform1f(burnU.uDpr, ratio);
        gl.uniform2f(burnU.uCenter, frame.cx, frame.cy);
        gl.uniform1f(burnU.uTime, frame.time);
        gl.uniform1f(burnU.uFlare, frame.flare);
        gl.uniform1f(burnU.uIgnited, frame.ignited ? 1 : 0);
        gl.uniform1f(burnU.uShock, frame.shock);
        gl.uniform2f(burnU.uMouse, frame.mouseX, frame.mouseY);
        gl.uniform1f(burnU.uHeat, frame.heat);
        gl.uniform1f(burnU.uCharge, frame.charge);
        gl.uniform1i(burnU.uFront, 0);
        gl.uniform1i(burnU.uScorch, 1);
        gl.bindVertexArray(quadVao);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      }

      if (frame.flakeCount > 0) {
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
        gl.useProgram(flakeProgram);
        gl.uniform2f(flakeU.uRes, width, height);
        gl.uniform1f(flakeU.uDpr, ratio);
        gl.bindVertexArray(flakeVao);
        gl.bindBuffer(gl.ARRAY_BUFFER, flakeBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, frame.flakes.subarray(0, frame.flakeCount * FLAKE_STRIDE), gl.DYNAMIC_DRAW);
        gl.drawArrays(gl.POINTS, 0, frame.flakeCount);
      }

      if (frame.emberCount > 0) {
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.ONE, gl.ONE);
        gl.useProgram(emberProgram);
        gl.uniform2f(emberU.uRes, width, height);
        gl.uniform1f(emberU.uDpr, ratio);
        gl.bindVertexArray(emberVao);
        gl.bindBuffer(gl.ARRAY_BUFFER, emberBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, frame.embers.subarray(0, frame.emberCount * 4), gl.DYNAMIC_DRAW);
        gl.drawArrays(gl.POINTS, 0, frame.emberCount);
      }
      gl.bindVertexArray(null);
    },
    destroy() {
      gl.deleteProgram(burnProgram);
      gl.deleteProgram(emberProgram);
      gl.deleteProgram(flakeProgram);
      gl.deleteBuffer(quad);
      gl.deleteBuffer(emberBuffer);
      gl.deleteBuffer(flakeBuffer);
      gl.deleteTexture(frontTexture);
      gl.deleteTexture(scorchTexture);
      gl.deleteVertexArray(quadVao);
      gl.deleteVertexArray(emberVao);
      gl.deleteVertexArray(flakeVao);
    },
  };
}
