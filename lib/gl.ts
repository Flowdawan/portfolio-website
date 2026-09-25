// Minimal WebGL2 helpers — deliberately tiny instead of pulling in three.js.

/**
 * Compiles and links without blocking the main thread. The GPU process compiles
 * in the background; reading LINK_STATUS before it is done would stall until it
 * finishes (hundreds of milliseconds on software renderers). With
 * KHR_parallel_shader_compile we poll for completion, otherwise we simply give
 * the driver `settleMs` before asking.
 */
export async function createProgramAsync(gl: WebGL2RenderingContext, vertexSource: string, fragmentSource: string, settleMs = 600) {
  const parallel = gl.getExtension("KHR_parallel_shader_compile");
  const vertex = gl.createShader(gl.VERTEX_SHADER);
  const fragment = gl.createShader(gl.FRAGMENT_SHADER);
  const program = gl.createProgram();
  if (!vertex || !fragment || !program) throw new Error("Could not create program");
  gl.shaderSource(vertex, vertexSource);
  gl.shaderSource(fragment, fragmentSource);
  gl.compileShader(vertex);
  gl.compileShader(fragment);
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);

  if (parallel) {
    await new Promise<void>((resolve) => {
      const poll = () => {
        if (gl.isContextLost() || gl.getProgramParameter(program, parallel.COMPLETION_STATUS_KHR)) resolve();
        else window.setTimeout(poll, 16);
      };
      poll();
    });
  } else {
    await new Promise((resolve) => window.setTimeout(resolve, settleMs));
  }

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const log = gl.getProgramInfoLog(program) || gl.getShaderInfoLog(fragment) || gl.getShaderInfoLog(vertex);
    gl.deleteProgram(program);
    gl.deleteShader(vertex);
    gl.deleteShader(fragment);
    throw new Error(`Program link failed: ${log}`);
  }
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  return program;
}

export function uniforms<T extends string>(gl: WebGL2RenderingContext, program: WebGLProgram, names: readonly T[]) {
  const map = {} as Record<T, WebGLUniformLocation | null>;
  for (const name of names) map[name] = gl.getUniformLocation(program, name);
  return map;
}

const SOFTWARE_RENDERER = /swiftshader|llvmpipe|softpipe|software|basic render|warp/i;

/**
 * True when WebGL runs on a CPU rasteriser (SwiftShader, llvmpipe, WARP …) —
 * VMs, remote desktops, blocklisted drivers. Full-screen shaders then cost real
 * CPU time per frame, so callers pick lighter fallbacks.
 */
export function isSoftwareRenderer(gl: WebGL2RenderingContext) {
  const info = gl.getExtension("WEBGL_debug_renderer_info");
  return SOFTWARE_RENDERER.test(String(gl.getParameter(info ? info.UNMASKED_RENDERER_WEBGL : gl.RENDERER) ?? ""));
}

// The very first WebGL context of a page can take hundreds of milliseconds to
// create on CPU rasterisers, so the probe runs in a worker on an OffscreenCanvas
// and never touches the main thread. Older browsers fall back to a quick
// main-thread probe (they have a real GPU in practice).
const PROBE_WORKER = `self.onmessage=()=>{try{const c=new OffscreenCanvas(1,1).getContext("webgl2");if(!c){postMessage(null);return}const i=c.getExtension("WEBGL_debug_renderer_info");const r=String(c.getParameter(i?i.UNMASKED_RENDERER_WEBGL:c.RENDERER));const l=c.getExtension("WEBGL_lose_context");if(l)l.loseContext();postMessage(r)}catch(e){postMessage(null)}}`;

function probeInWorker() {
  return new Promise<boolean>((resolve, reject) => {
    if (typeof Worker === "undefined" || typeof OffscreenCanvas === "undefined") {
      reject(new Error("no worker probe"));
      return;
    }
    const url = URL.createObjectURL(new Blob([PROBE_WORKER], { type: "text/javascript" }));
    const worker = new Worker(url);
    const finish = () => {
      window.clearTimeout(timeout);
      worker.terminate();
      URL.revokeObjectURL(url);
    };
    const timeout = window.setTimeout(() => {
      finish();
      reject(new Error("probe timed out"));
    }, 4000);
    worker.onmessage = (event: MessageEvent<string | null>) => {
      finish();
      if (typeof event.data === "string") resolve(SOFTWARE_RENDERER.test(event.data));
      else reject(new Error("no WebGL2 in workers"));
    };
    worker.onerror = () => {
      finish();
      reject(new Error("probe failed"));
    };
    worker.postMessage(0);
  });
}

function probeOnMainThread() {
  const probe = document.createElement("canvas").getContext("webgl2");
  const software = probe ? isSoftwareRenderer(probe) : true;
  probe?.getExtension("WEBGL_lose_context")?.loseContext();
  return software;
}

let softwareGL: Promise<boolean> | null = null;

/** Resolves (once per page) to true when WebGL would run without a GPU. */
export function detectSoftwareGL() {
  softwareGL ??= probeInWorker().catch(() => probeOnMainThread());
  return softwareGL;
}

/** Heuristic for phones, tablets and small/low-core machines. */
export function isLowPower() {
  const coarse = window.matchMedia("(max-width: 760px), (pointer: coarse)").matches;
  const cores = navigator.hardwareConcurrency ?? 8;
  return coarse || cores <= 4;
}

// GLSL simplex noise (Ashima Arts / Ian McEwan, MIT) shared by the shaders.
export const GLSL_NOISE = /* glsl */ `
vec3 permute3(vec3 x) { return mod(((x * 34.0) + 1.0) * x, 289.0); }
float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
  vec2 i = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute3(permute3(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
  m = m * m;
  m = m * m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}
float fbm2(vec2 p) {
  return (snoise(p) * 0.66 + snoise(p * 2.07 + 9.3) * 0.34);
}
`;
