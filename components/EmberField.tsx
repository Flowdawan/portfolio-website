"use client";

import { useEffect, useRef } from "react";
import { createProgramAsync, detectSoftwareGL, isLowPower, uniforms } from "@/lib/gl";
import { whenIdle } from "@/lib/idle";
import { intro } from "@/lib/intro";
import { onScroll } from "@/lib/scroll";

// Embers rising from the bottom of the hero (and again behind the contact
// section). Every particle is animated statelessly in the vertex shader from a
// seed and the clock, so the CPU cost is one uniform upload per frame. The loop
// sleeps whenever neither section is on screen or the tab is hidden.

const VS = /* glsl */ `#version 300 es
in vec4 aSeed; // x0, phase, speed, size
in float aKind;
uniform float uTime;
uniform vec2 uRes;
uniform float uDpr;
uniform vec2 uMouse;
uniform vec2 uMouseVel;
uniform float uIntensity;
uniform float uBurst;
uniform float uLift;
out float vAlpha;
out float vHeat;
out float vKind;

void main() {
  float speed = 0.016 + 0.05 * aSeed.z;
  float life = fract(aSeed.y + uTime * speed * (1.0 + uBurst * 2.2));
  float rise = 0.62 + 0.62 * aSeed.z;
  float y = uRes.y * (1.06 - life * rise) - uLift * (0.35 + 0.65 * aSeed.w);
  float x = aSeed.x * uRes.x;
  float t = uTime;
  x += sin(t * (0.55 + aSeed.z) + aSeed.y * 40.0) * (12.0 + 34.0 * aSeed.w);
  x += sin(y * 0.011 + t * 0.8 + aSeed.x * 21.0) * 26.0 * life;

  vec2 p = vec2(x, y);
  vec2 d = p - uMouse;
  float dist = length(d);
  float R = 150.0;
  if (dist < R) {
    float f = 1.0 - dist / R;
    f *= f;
    p += (d / max(dist, 0.001)) * f * 70.0;
    p += vec2(-d.y, d.x) / max(dist, 0.001) * f * 26.0;
    p += uMouseVel * f * 0.05;
  }

  float fadeIn = smoothstep(0.0, 0.08, life);
  float fadeOut = 1.0 - smoothstep(0.45 + 0.4 * aSeed.w, 1.0, life);
  float twinkle = 0.65 + 0.35 * sin(t * (3.0 + 6.0 * aSeed.z) + aSeed.y * 70.0);
  vHeat = 1.0 - life;
  vKind = aKind;

  float size;
  if (aKind > 0.5) {
    size = 10.0 + 22.0 * aSeed.w;
    vAlpha = 0.11 * fadeIn * fadeOut * uIntensity;
  } else {
    size = (2.2 + 5.2 * aSeed.w) * (1.0 - life * 0.4) * (1.0 + uBurst * 0.4);
    vAlpha = fadeIn * fadeOut * twinkle * uIntensity * (0.75 + uBurst * 0.5);
  }

  gl_Position = vec4(p.x / uRes.x * 2.0 - 1.0, 1.0 - p.y / uRes.y * 2.0, 0.0, 1.0);
  gl_PointSize = size * uDpr;
}`;

const FS = /* glsl */ `#version 300 es
precision mediump float;
in float vAlpha;
in float vHeat;
in float vKind;
out vec4 o;
void main() {
  vec2 q = gl_PointCoord * 2.0 - 1.0;
  float r2 = dot(q, q);
  if (r2 > 1.0) discard;
  float fall = vKind > 0.5 ? (1.0 - r2) * (1.0 - r2) : exp(-r2 * 9.0) * 1.35 + exp(-r2 * 2.2) * 0.22;
  vec3 c = mix(vec3(0.72, 0.13, 0.03), vec3(1.0, 0.5, 0.15), smoothstep(0.2, 0.62, vHeat));
  c = mix(c, vec3(1.0, 0.88, 0.64), smoothstep(0.8, 1.0, vHeat));
  float a = fall * vAlpha;
  o = vec4(c * a, a);
}`;

function runEmbers(canvas: HTMLCanvasElement, gl: WebGL2RenderingContext, program: WebGLProgram, initialBurst: number) {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const low = isLowPower();
  const embers = low ? 300 : 820;
  const bokeh = low ? 14 : 36;
  const total = embers + bokeh;

  const seeds = new Float32Array(total * 4);
  const kinds = new Float32Array(total);
  for (let i = 0; i < total; i += 1) {
    // Bias embers towards the centre-bottom like the glow of a fire pit.
    const spread = Math.random() < 0.7 ? 0.5 + (Math.random() + Math.random() + Math.random() - 1.5) * 0.42 : Math.random();
    seeds[i * 4] = Math.min(1.05, Math.max(-0.05, spread));
    seeds[i * 4 + 1] = Math.random();
    seeds[i * 4 + 2] = Math.random();
    seeds[i * 4 + 3] = Math.pow(Math.random(), 1.6);
    kinds[i] = i >= embers ? 1 : 0;
  }

  const u = uniforms(gl, program, ["uTime", "uRes", "uDpr", "uMouse", "uMouseVel", "uIntensity", "uBurst", "uLift"] as const);
  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);
  const seedBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, seedBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, seeds, gl.STATIC_DRAW);
  const seedLoc = gl.getAttribLocation(program, "aSeed");
  gl.enableVertexAttribArray(seedLoc);
  gl.vertexAttribPointer(seedLoc, 4, gl.FLOAT, false, 0, 0);
  const kindBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, kindBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, kinds, gl.STATIC_DRAW);
  const kindLoc = gl.getAttribLocation(program, "aKind");
  gl.enableVertexAttribArray(kindLoc);
  gl.vertexAttribPointer(kindLoc, 1, gl.FLOAT, false, 0, 0);
  gl.bindVertexArray(null);

  gl.useProgram(program);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE);

  const dpr = low ? 1 : Math.min(window.devicePixelRatio || 1, 1.75);
  let width = 1;
  let height = 1;
  const resize = () => {
    width = canvas.clientWidth || window.innerWidth;
    height = canvas.clientHeight || window.innerHeight;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    gl.viewport(0, 0, canvas.width, canvas.height);
    measure();
    wake();
  };

  const hero = document.getElementById("home");
  const contact = document.getElementById("contact");
  let heroBottom = 1;
  let contactTop = Infinity;
  const measure = () => {
    const y = window.scrollY;
    if (hero) heroBottom = hero.getBoundingClientRect().bottom + y;
    if (contact) contactTop = contact.getBoundingClientRect().top + y;
  };

  let scrollY = 0;
  let intensity = 1;
  let lift = 0;
  const computeIntensity = () => {
    const heroPart = 1 - Math.min(1, Math.max(0, scrollY / (heroBottom * 0.85)));
    const contactPart = Math.min(1, Math.max(0, (scrollY + height - contactTop) / (height * 0.9)));
    intensity = Math.max(heroPart, contactPart * 0.9);
    lift = heroPart > contactPart ? scrollY * 0.45 : 0;
  };

  let mouseX = -9999;
  let mouseY = -9999;
  let velX = 0;
  let velY = 0;
  let lastMove = performance.now();
  const onPointer = (event: PointerEvent) => {
    const now = performance.now();
    const dt = Math.max(1, now - lastMove) / 1000;
    lastMove = now;
    if (mouseX > -9000) {
      velX += ((event.clientX - mouseX) / dt - velX) * 0.25;
      velY += ((event.clientY - mouseY) / dt - velY) * 0.25;
    }
    mouseX = event.clientX;
    mouseY = event.clientY;
    wake();
  };
  const onLeave = () => {
    mouseX = -9999;
    mouseY = -9999;
  };

  let burst = initialBurst;
  const start = performance.now();
  let raf = 0;
  let running = false;

  const draw = (now: number) => {
    const t = (now - start) / 1000;
    velX *= 0.92;
    velY *= 0.92;
    burst *= 0.985;
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform1f(u.uTime, reduced ? 42 : t + 40);
    gl.uniform2f(u.uRes, width, height);
    gl.uniform1f(u.uDpr, dpr);
    gl.uniform2f(u.uMouse, mouseX, mouseY);
    gl.uniform2f(u.uMouseVel, velX, velY);
    gl.uniform1f(u.uIntensity, intensity);
    gl.uniform1f(u.uBurst, burst);
    gl.uniform1f(u.uLift, lift);
    gl.bindVertexArray(vao);
    gl.drawArrays(gl.POINTS, 0, total);
  };

  // While the 2001 page still covers the hero there is nothing to show.
  const covered = () => document.documentElement.classList.contains("is-intro") && intro.phase === "pending";

  const frame = (now: number) => {
    if (covered()) {
      running = false;
      return;
    }
    draw(now);
    if (reduced || intensity < 0.01 || document.hidden) {
      running = false;
      return;
    }
    raf = requestAnimationFrame(frame);
  };

  function wake() {
    if (running) return;
    running = true;
    raf = requestAnimationFrame(frame);
  }

  const offScroll = onScroll((y) => {
    scrollY = y;
    computeIntensity();
    wake();
  });
  const offIntro = intro.subscribe((phase) => {
    if (phase === "done") burst = 1;
    wake();
  });
  const onVisibility = () => {
    if (!document.hidden) wake();
  };

  resize();
  computeIntensity();
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(canvas);
  // Fonts and lazily loaded previews change the page height over time, which
  // moves the contact section.
  const layoutObserver = new ResizeObserver(() => {
    measure();
    computeIntensity();
  });
  layoutObserver.observe(document.body);
  window.addEventListener("pointermove", onPointer, { passive: true });
  document.addEventListener("pointerleave", onLeave);
  document.addEventListener("visibilitychange", onVisibility);
  const settle = window.setTimeout(measure, 1200);

  return () => {
    cancelAnimationFrame(raf);
    window.clearTimeout(settle);
    offScroll();
    offIntro();
    resizeObserver.disconnect();
    layoutObserver.disconnect();
    window.removeEventListener("pointermove", onPointer);
    document.removeEventListener("pointerleave", onLeave);
    document.removeEventListener("visibilitychange", onVisibility);
    gl.deleteBuffer(seedBuffer);
    gl.deleteBuffer(kindBuffer);
    gl.deleteVertexArray(vao);
    gl.deleteProgram(program);
  };
}

export function EmberField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let disposed = false;
    let stop: (() => void) | null = null;
    // Embers that appear right after the fire rise faster for a moment.
    const afterFire = document.documentElement.classList.contains("is-intro");

    // Start once the page has settled: after the burn intro (whose own sparks
    // fill the hole meanwhile) or, on repeat visits, once the browser is idle.
    // The shaders then compile in the background.
    const start = async () => {
      // Without a GPU the embers are skipped: smooth scrolling matters more.
      if (await detectSoftwareGL()) return;
      if (disposed) return;
      const gl = canvas.getContext("webgl2", { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false });
      if (!gl) return;
      try {
        const program = await createProgramAsync(gl, VS, FS);
        if (disposed) {
          gl.deleteProgram(program);
          return;
        }
        stop = runEmbers(canvas, gl, program, afterFire ? 1 : 0);
        canvas.classList.add("is-on");
      } catch (error) {
        console.warn(error);
      }
    };

    let cancelIdle = () => {};
    const begin = () => {
      cancelIdle = whenIdle(start, 1500);
    };
    const offIntro = intro.subscribe((phase) => {
      if (phase === "done") {
        offIntro();
        begin();
      }
    });
    if (intro.phase === "done") {
      offIntro();
      begin();
    }

    return () => {
      disposed = true;
      offIntro();
      cancelIdle();
      stop?.();
    };
  }, []);

  return <canvas ref={canvasRef} className="embers" aria-hidden="true" />;
}
