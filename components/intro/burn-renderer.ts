import { createProgramAsync, GLSL_NOISE, uniforms } from "@/lib/gl";

// Renders the fire on top of the 2001 page. The burn front itself is computed on
// the CPU (see BurnIntro) as a radius per angle around the ignition point and
// uploaded as a 1D float texture — the same table also clips the DOM, so the hole
// in the old page and the charred edge drawn here always line up exactly.

export const FRONT_SAMPLES = 360;

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
uniform sampler2D uFront;
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
  vec2 d = p - uCenter;
  float dist = length(d);
  float ang = atan(d.y, d.x);
  float s = dist - frontAt(ang); // > 0: paper that has not burned yet

  vec3 emit = vec3(0.0);
  if (uFlare > 0.001) {
    emit += vec3(1.0, 0.7, 0.36) * exp(-dist / (22.0 + 110.0 * uFlare)) * uFlare * 1.7;
  }

  if (s > 290.0 || s < -120.0) {
    float ea = clamp(max(emit.r, max(emit.g, emit.b)), 0.0, 1.0);
    outColor = vec4(min(emit, vec3(1.0)), ea);
    return;
  }

  vec2 n = dist > 0.5 ? d / dist : vec2(0.0, -1.0);
  float facingUp = clamp(-n.y, 0.0, 1.0);
  float t = uTime;
  vec4 col = vec4(0.0);

  // Two noise lookups shape the whole edge: a broad one for the scorch and
  // char width, a fine one for the ragged inner rim.
  float broad = snoise(p / 64.0 + 3.7) * 0.5 + 0.5;
  float fine = snoise(p / 18.0) * 0.5 + 0.5;

  // Paper side: heat discolouration, then a deep scorch right before the flame.
  if (s > 0.0) {
    float scorchW = 28.0 + 54.0 * broad;
    float scorch = pow(clamp(1.0 - s / scorchW, 0.0, 1.0), 1.45);
    float tint = pow(clamp(1.0 - s / (scorchW * 2.9), 0.0, 1.0), 2.0) * 0.34;
    vec3 brown = mix(vec3(0.44, 0.25, 0.1), vec3(0.07, 0.035, 0.018), scorch);
    float a = max(scorch * 0.97, tint);
    col = vec4(brown * a, a);
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

export type BurnFrame = {
  time: number;
  cx: number;
  cy: number;
  flare: number;
  front: Float32Array;
  drawBurn: boolean;
  embers: Float32Array;
  emberCount: number;
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
  try {
    // The fire is lit ~1.6 s after load at the earliest, so without parallel
    // compilation the driver gets a generous head start before we ask.
    [burnProgram, emberProgram] = await Promise.all([
      createProgramAsync(gl, QUAD_VS, BURN_FS, 900),
      createProgramAsync(gl, EMBER_VS, EMBER_FS, 900),
    ]);
  } catch (error) {
    console.warn(error);
    return null;
  }

  const burnU = uniforms(gl, burnProgram, ["uRes", "uDpr", "uCenter", "uTime", "uFlare", "uFront"] as const);
  const emberU = uniforms(gl, emberProgram, ["uRes", "uDpr"] as const);

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
  gl.bindVertexArray(null);

  const frontTexture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, frontTexture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.R32F, FRONT_SAMPLES, 1, 0, gl.RED, gl.FLOAT, new Float32Array(FRONT_SAMPLES));

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
        gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, FRONT_SAMPLES, 1, gl.RED, gl.FLOAT, frame.front);
        gl.uniform2f(burnU.uRes, width, height);
        gl.uniform1f(burnU.uDpr, ratio);
        gl.uniform2f(burnU.uCenter, frame.cx, frame.cy);
        gl.uniform1f(burnU.uTime, frame.time);
        gl.uniform1f(burnU.uFlare, frame.flare);
        gl.uniform1i(burnU.uFront, 0);
        gl.bindVertexArray(quadVao);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
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
      gl.deleteBuffer(quad);
      gl.deleteBuffer(emberBuffer);
      gl.deleteTexture(frontTexture);
      gl.deleteVertexArray(quadVao);
      gl.deleteVertexArray(emberVao);
    },
  };
}
