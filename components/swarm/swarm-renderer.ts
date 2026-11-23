import { createProgramAsync, uniforms } from "@/lib/gl";
import { buildSwarm } from "./shapes";

// Draws the ember swarm as charcoal dust on paper: every particle carries one position per form and the
// vertex shader blends between them (with a per-particle delay and a swirl, so
// a form melts into embers and re-forges as the next one). The pipeline loop is
// evaluated analytically so its embers can flow. CPU cost per frame: a handful
// of uniforms.

const VS = /* glsl */ `#version 300 es
in vec4 aRand;   // delay, seed, size, phase
in vec4 aNeuA;   // edge start xyz, flow speed
in vec4 aNeuB;   // edge end xyz, 1 = edge particle
in vec3 aCode;
in vec3 aShield;
in vec4 aPipe;   // loop t, tube radius, tube angle, station flag
uniform float uTime;
uniform float uStage;
uniform float uGather;
uniform float uRot;
uniform float uTilt;
uniform float uScale;
uniform float uDpr;
uniform float uFade;
uniform vec2 uCenter;
uniform vec2 uMouse;
uniform vec2 uView;
out float vAlpha;
out float vHeat;
out float vSoft;

float gBonus;

vec3 neural() {
  if (aNeuB.w < 0.5) {
    gBonus = 0.35;
    return aNeuA.xyz + 0.01 * vec3(sin(uTime * 1.3 + aRand.y), cos(uTime * 1.1 + aRand.y * 1.3), 0.0);
  }
  float u = fract(aRand.w + uTime * 0.12 * aNeuA.w);
  // Signals arrive hot at the next neuron.
  gBonus = 0.45 * smoothstep(0.7, 1.0, u);
  return mix(aNeuA.xyz, aNeuB.xyz, u);
}

vec3 pipeline() {
  bool station = aPipe.w > 0.5;
  float t = (aPipe.x + (station ? 0.0 : uTime * 0.03)) * 6.2831853;
  float s = sin(t);
  float c = cos(t);
  float d = 1.0 + s * s;
  vec3 center = vec3(1.3 * c / d, 1.55 * s * c / d, 0.42 * s);
  gBonus = station ? 0.5 + 0.2 * sin(uTime * 3.0 + aPipe.x * 20.0) : 0.0;
  return center + vec3(0.0, cos(aPipe.z), sin(aPipe.z)) * aPipe.y;
}

vec3 shape(float i) {
  gBonus = 0.0;
  if (i < 0.5) return neural();
  if (i < 1.5) return aCode;
  if (i < 2.5) return pipeline();
  vec3 p = aShield;
  gBonus = p.z > 0.18 ? 0.25 : 0.0;
  return p;
}

vec3 scatter() {
  float sx = fract(aRand.y * 0.371) - 0.5;
  float sz = fract(aRand.y * 0.137) - 0.5;
  float sy = mod(fract(aRand.y * 0.713) * 3.2 + uTime * 0.07 * (0.5 + aRand.w), 3.2) - 1.6;
  return vec3(sx * 4.6 + sin(uTime * 0.5 + aRand.y) * 0.1, sy, sz * 2.0);
}

void main() {
  float st = clamp(uStage, 0.0, 3.0);
  float i0 = min(floor(st), 2.0);
  float f = st - i0;
  float k = smoothstep(0.0, 1.0, clamp((f - aRand.x * 0.4) / 0.6, 0.0, 1.0));

  vec3 a = shape(i0);
  float bonusA = gBonus;
  vec3 b = shape(i0 + 1.0);
  float bonus = mix(bonusA, gBonus, k);
  vec3 p = mix(a, b, k);

  // Between forms the embers melt, rise and swirl.
  float swirl = sin(3.14159265 * k);
  vec3 drift = vec3(
    sin(aRand.y * 1.7 + uTime * 0.9),
    cos(aRand.y * 2.3 + uTime * 0.7) * 0.6 + 0.55,
    sin(aRand.y * 3.1 + uTime * 0.8)
  );
  p += swirl * drift * 0.5;
  p += 0.007 * vec3(sin(uTime * 2.1 + aRand.y), cos(uTime * 1.7 + aRand.y * 1.3), 0.0);

  float g = smoothstep(0.0, 1.0, clamp((uGather - aRand.x * 0.35) / 0.65, 0.0, 1.0));
  p = mix(scatter(), p, g);

  // Rotate (Y, then X) and project.
  float cr = cos(uRot);
  float sr = sin(uRot);
  p = vec3(cr * p.x + sr * p.z, p.y, -sr * p.x + cr * p.z);
  float ct = cos(uTilt);
  float stt = sin(uTilt);
  p = vec3(p.x, ct * p.y - stt * p.z, stt * p.y + ct * p.z);
  float persp = 3.4 / (3.4 - p.z);
  vec2 screen = uCenter + vec2(p.x, -p.y) * uScale * persp;

  // The cursor parts the embers.
  vec2 dm = screen - uMouse;
  float dist = length(dm);
  float R = 110.0;
  if (dist < R) {
    float push = 1.0 - dist / R;
    screen += dm / max(dist, 0.001) * push * push * 46.0;
    bonus += push * 0.4;
  }

  float depth = clamp((p.z + 1.1) / 2.2, 0.0, 1.0);
  float twinkle = 0.78 + 0.22 * sin(uTime * (2.0 + 4.0 * aRand.w) + aRand.y * 9.0);
  // Charcoal: cold dust is ink; only what is moving (re-forming, firing, parted
  // by the cursor) turns signal red.
  vHeat = clamp(swirl * 0.95 + bonus * 0.9, 0.0, 1.0);

  float size;
  if (aRand.z > 1.0) {
    // Soft smudges, like charcoal rubbed into the paper.
    size = (10.0 + 8.0 * (aRand.z - 2.0)) * persp;
    vAlpha = 0.035 * uFade * g;
    vSoft = 1.0;
  } else {
    size = (1.25 + 2.1 * aRand.z) * persp * (1.0 + 0.25 * swirl);
    vAlpha = (0.32 + 0.5 * depth) * twinkle * uFade * mix(0.45, 1.0, g);
    vSoft = 0.0;
  }

  gl_PointSize = size * uDpr;
  gl_Position = vec4(screen.x / uView.x * 2.0 - 1.0, 1.0 - screen.y / uView.y * 2.0, 0.0, 1.0);
}`;

const FS = /* glsl */ `#version 300 es
precision mediump float;
in float vAlpha;
in float vHeat;
in float vSoft;
out vec4 o;
void main() {
  vec2 q = gl_PointCoord * 2.0 - 1.0;
  float r2 = dot(q, q);
  if (r2 > 1.0) discard;
  float fall = vSoft > 0.5 ? (1.0 - r2) * (1.0 - r2) : 1.0 - smoothstep(0.35, 1.0, r2);
  vec3 c = mix(vec3(0.078, 0.07, 0.063), vec3(0.878, 0.25, 0.106), smoothstep(0.3, 0.85, vHeat));
  float a = clamp(fall * vAlpha, 0.0, 1.0);
  o = vec4(c * a, a);
}`;

export type SwarmFrame = {
  time: number;
  stage: number;
  gather: number;
  rot: number;
  tilt: number;
  fade: number;
  centerX: number;
  centerY: number;
  scale: number;
  mouseX: number;
  mouseY: number;
};

export type SwarmRenderer = {
  resize: (width: number, height: number, dpr: number) => void;
  render: (frame: SwarmFrame) => void;
  destroy: () => void;
};

export async function createSwarmRenderer(canvas: HTMLCanvasElement, count: number): Promise<SwarmRenderer | null> {
  const gl = canvas.getContext("webgl2", { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false });
  if (!gl) return null;
  let program: WebGLProgram;
  try {
    program = await createProgramAsync(gl, VS, FS, 700);
  } catch (error) {
    console.warn(error);
    return null;
  }

  const geo = buildSwarm(count);
  const u = uniforms(gl, program, [
    "uTime",
    "uStage",
    "uGather",
    "uRot",
    "uTilt",
    "uScale",
    "uDpr",
    "uFade",
    "uCenter",
    "uMouse",
    "uView",
  ] as const);

  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);
  const buffers: WebGLBuffer[] = [];
  const attribute = (name: string, data: Float32Array, size: number) => {
    const location = gl.getAttribLocation(program, name);
    const buffer = gl.createBuffer();
    if (!buffer) return;
    buffers.push(buffer);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    if (location < 0) return;
    gl.enableVertexAttribArray(location);
    gl.vertexAttribPointer(location, size, gl.FLOAT, false, 0, 0);
  };
  attribute("aRand", geo.rand, 4);
  attribute("aNeuA", geo.neuralA, 4);
  attribute("aNeuB", geo.neuralB, 4);
  attribute("aCode", geo.code, 3);
  attribute("aShield", geo.shield, 3);
  attribute("aPipe", geo.pipe, 4);
  gl.bindVertexArray(null);

  let width = 1;
  let height = 1;
  let ratio = 1;

  return {
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
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.useProgram(program);
      gl.uniform1f(u.uTime, frame.time);
      gl.uniform1f(u.uStage, frame.stage);
      gl.uniform1f(u.uGather, frame.gather);
      gl.uniform1f(u.uRot, frame.rot);
      gl.uniform1f(u.uTilt, frame.tilt);
      gl.uniform1f(u.uScale, frame.scale);
      gl.uniform1f(u.uDpr, ratio);
      gl.uniform1f(u.uFade, frame.fade);
      gl.uniform2f(u.uCenter, frame.centerX, frame.centerY);
      gl.uniform2f(u.uMouse, frame.mouseX, frame.mouseY);
      gl.uniform2f(u.uView, width, height);
      gl.bindVertexArray(vao);
      gl.drawArrays(gl.POINTS, 0, geo.count);
      gl.bindVertexArray(null);
    },
    destroy() {
      buffers.forEach((buffer) => gl.deleteBuffer(buffer));
      gl.deleteVertexArray(vao);
      gl.deleteProgram(program);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    },
  };
}
