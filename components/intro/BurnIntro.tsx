"use client";

import { useEffect, useRef, useState } from "react";
import { detectSoftwareGL, isLowPower } from "@/lib/gl";
import { whenIdle } from "@/lib/idle";
import { heroChars, intro, resetForge, SEEN_KEY, sweepForge } from "@/lib/intro";
import { createNoise2D, fbm } from "@/lib/noise";
import { lockScroll, scrollToTarget, unlockScroll } from "@/lib/scroll";
import { createBurnLite } from "./burn-lite";
import { createBurnRenderer, FLAKE_STRIDE, FRONT_SAMPLES, SCORCH_CELL, type BurnRenderer } from "./burn-renderer";
import { OldSite } from "./OldSite";

const N = FRONT_SAMPLES;
const TAU = Math.PI * 2;
const AUTO_IGNITE_MS = 1650;
/** While someone is playing with the burning glass, the fire waits up to this long. */
const PLAY_IGNITE_MS = 7000;
/** Seconds the light has to rest on one spot before the paper catches. */
const DWELL_SECONDS = 1.05;
const BURN_SECONDS = 2.55;
const SKIP_SECONDS = 0.6;

const COS = new Float32Array(N);
const SIN = new Float32Array(N);
for (let k = 0; k < N; k += 1) {
  const angle = -Math.PI + (TAU * k) / N;
  COS[k] = Math.cos(angle);
  SIN[k] = Math.sin(angle);
}

type Ember = { x: number; y: number; vx: number; vy: number; life: number; max: number; size: number; seed: number };
type Flake = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
  life: number;
  size: number;
  angle: number;
  spin: number;
  flipSpeed: number;
  seed: number;
};
type ForgeTarget = { el: HTMLElement; x: number; y: number };

/** Hands the page over to the visitor: reveals UI, unlocks scrolling, remembers the visit. */
function completeIntro() {
  const html = document.documentElement;
  html.classList.remove("is-intro", "forge-cold");
  html.classList.add("is-ready");
  unlockScroll();
  intro.set("done");
  try {
    sessionStorage.setItem(SEEN_KEY, "1");
  } catch {
    // Private mode or storage disabled — the intro simply plays again next time.
  }
}

// The fire starts slowly, catches, then races across the screen.
const ease = (p: number) => 0.15 * p + 0.85 * p * p;

export function BurnIntro() {
  const shellRef = useRef<HTMLDivElement>(null);
  const siteRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const skipRef = useRef<(() => void) | null>(null);
  const [run, setRun] = useState(0);

  useEffect(
    () =>
      intro.onReplay(() => {
        try {
          sessionStorage.removeItem(SEEN_KEY);
        } catch {
          // ignore
        }
        scrollToTarget(0, { immediate: true });
        resetForge();
        const html = document.documentElement;
        html.classList.remove("is-ready");
        html.classList.add("is-intro", "forge-cold");
        intro.set("pending");
        setRun((current) => current + 1);
      }),
    [],
  );

  useEffect(() => {
    const html = document.documentElement;
    const shell = shellRef.current;
    const site = siteRef.current;
    const canvas = canvasRef.current;
    if (!shell || !site || !canvas) return;

    if (!html.classList.contains("is-intro")) {
      shell.dataset.state = "off";
      completeIntro();
      sweepForge(heroChars(), 22);
      return;
    }

    (window as Window & { __introStarted?: boolean }).__introStarted = true;
    const low = isLowPower();
    shell.classList.toggle("intro--replay", run > 0);
    shell.dataset.state = "idle";
    shell.setAttribute("data-cursor-lens", "");
    site.style.clipPath = "";
    site.style.visibility = "";
    lockScroll();
    window.scrollTo(0, 0);
    intro.set("pending");

    // Measure the overlay itself rather than window.inner*: on mobile the layout
    // viewport can briefly differ from what the fixed overlay really covers.
    let width = shell.clientWidth || window.innerWidth;
    let height = shell.clientHeight || window.innerHeight;
    let dpr = low ? 1 : Math.min(window.devicePixelRatio || 1, 1.5);

    // The renderer is created once the first frame is on screen. With a real
    // GPU the fire is a WebGL shader compiled in the background; on CPU
    // rasterisers (or without WebGL) a light Canvas 2D fire takes its place.
    let renderer: BurnRenderer | null = null;
    let disposed = false;
    let cancelIdle = () => {};
    const afterFirstFrame = requestAnimationFrame(() => {
      cancelIdle = whenIdle(() => {
        const lite = () => createBurnLite(canvas);
        const pending = detectSoftwareGL().then((software) =>
          software ? lite() : createBurnRenderer(canvas).then((created) => created ?? lite()),
        );
        void pending.then((created) => {
          if (disposed) {
            created?.destroy();
            return;
          }
          if (!created) return;
          renderer = created;
          if (created.software) dpr = 1;
          renderer.resize(width, height, dpr);
        });
      }, 400);
    });

    const noise = createNoise2D(1 + Math.floor(Math.random() * 997));
    const front = new Float32Array(N);
    const maxEmbers = low ? 320 : 900;
    const emberData = new Float32Array(maxEmbers * 4);
    const embers: Ember[] = [];
    const maxFlakes = low ? 90 : 260;
    const flakeData = new Float32Array(maxFlakes * FLAKE_STRIDE);
    const flakes: Flake[] = [];
    const timers: number[] = [];

    // Burning glass: where the light rests, how hot it is and the scorch it leaves.
    let mouseX = -999;
    let mouseY = -999;
    let lastMoveAt = 0;
    let pointerSpeed = 0;
    let lightOn = false;
    let heat = 0;
    let charge = 0;
    let lensShown = -1;
    let scorchW = 0;
    let scorchH = 0;
    let scorchF = new Float32Array(0);
    let scorch = new Uint8Array(0);
    let scorchDirty = false;
    const allocScorch = () => {
      scorchW = Math.max(1, Math.ceil(width / SCORCH_CELL));
      scorchH = Math.max(1, Math.ceil(height / SCORCH_CELL));
      scorchF = new Float32Array(scorchW * scorchH);
      scorch = new Uint8Array(scorchW * scorchH);
    };
    allocScorch();
    const splat = (x: number, y: number, radius: number, amount: number) => {
      const gx = x / SCORCH_CELL;
      const gy = y / SCORCH_CELL;
      const gr = radius / SCORCH_CELL;
      const x0 = Math.max(0, Math.floor(gx - gr));
      const x1 = Math.min(scorchW - 1, Math.ceil(gx + gr));
      const y0 = Math.max(0, Math.floor(gy - gr));
      const y1 = Math.min(scorchH - 1, Math.ceil(gy + gr));
      const inv = 1 / (gr * gr * 0.42);
      for (let yy = y0; yy <= y1; yy += 1) {
        for (let xx = x0; xx <= x1; xx += 1) {
          const dx = xx + 0.5 - gx;
          const dy = yy + 0.5 - gy;
          const w = Math.exp(-(dx * dx + dy * dy) * inv);
          if (w < 0.01) continue;
          const i = yy * scorchW + xx;
          const v = Math.min(1, scorchF[i] + amount * w);
          scorchF[i] = v;
          scorch[i] = (v * 255) | 0;
        }
      }
      scorchDirty = true;
    };

    let cx = width / 2;
    let cy = height / 2;
    let rMax = 1;
    let ignited = false;
    let finished = false;
    let finishedAt = 0;
    let ignitedAt = 0;
    let progress = 0;
    let speed = 1;
    let emitCarry = 0;
    let raf = 0;
    let last = performance.now();
    let targets: ForgeTarget[] = [];

    const computeRMax = () => {
      rMax = Math.hypot(Math.max(cx, width - cx), Math.max(cy, height - cy)) + 80;
    };

    const frontAt = (angle: number) => {
      const f = (angle / TAU + 0.5) * N;
      const i0 = Math.floor(f);
      const t = f - i0;
      const a = ((i0 % N) + N) % N;
      const b = (a + 1) % N;
      return front[a] + (front[b] - front[a]) * t;
    };

    const computeFront = (radius: number) => {
      const amp = Math.min(50, 4 + radius * 0.3);
      for (let k = 0; k < N; k += 1) {
        const ux = COS[k];
        const uy = SIN[k];
        // Paper burns faster upwards: hot air rises.
        const base = radius * (1 + 0.24 * Math.max(0, -uy) - 0.06 * Math.max(0, uy));
        let r = base;
        for (let i = 0; i < 2; i += 1) {
          r = base + amp * fbm(noise, (cx + ux * r) / 230, (cy + uy * r) / 230, 3);
        }
        front[k] = Math.max(0, r);
      }
    };

    const applyClip = () => {
      const points = new Array<string>(N);
      for (let k = 0; k < N; k += 1) {
        points[k] = `${(cx + COS[k] * front[k]).toFixed(1)} ${(cy + SIN[k] * front[k]).toFixed(1)}`;
      }
      const value = `path(evenodd, "M0 0H${width}V${height}H0ZM${points.join("L")}Z")`;
      site.style.clipPath = value;
      site.style.setProperty("-webkit-clip-path", value);
    };

    const heatLetters = () => {
      if (!targets.length) return;
      targets = targets.filter((target) => {
        const dx = target.x - cx;
        const dy = target.y - cy;
        if (Math.hypot(dx, dy) < frontAt(Math.atan2(dy, dx)) - 4) {
          target.el.classList.add("is-hot");
          return false;
        }
        return true;
      });
    };

    const ignite = (x: number, y: number) => {
      if (ignited || finished) return;
      ignited = true;
      ignitedAt = performance.now();
      cx = Math.min(Math.max(x, 0), width);
      cy = Math.min(Math.max(y, 0), height);
      computeRMax();
      targets = heroChars().map((el) => {
        const rect = el.getBoundingClientRect();
        return { el, x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
      });
      shell.dataset.state = "burning";
      shell.removeAttribute("data-cursor-lens");
      lightOn = false;
      for (let i = 0; i < (low ? 10 : 26); i += 1) spawnFlake(cx, cy, Math.random() * TAU, 1.4);
      // The page jolts as it catches.
      site.animate(
        [
          { transform: "translate3d(0, 0, 0)" },
          { transform: "translate3d(-4px, 3px, 0)" },
          { transform: "translate3d(3px, -2px, 0)" },
          { transform: "translate3d(-2px, 1px, 0)" },
          { transform: "translate3d(0, 0, 0)" },
        ],
        { duration: 300, easing: "ease-out" },
      );
      window.dispatchEvent(new Event("cursor:refresh"));
      intro.set("burning");
    };

    const finish = () => {
      if (finished) return;
      finished = true;
      finishedAt = performance.now();
      site.style.visibility = "hidden";
      targets.forEach((target) => target.el.classList.add("is-hot"));
      targets = [];
      shell.dataset.state = "done";
      completeIntro();
      window.dispatchEvent(new Event("cursor:refresh"));
      timers.push(
        window.setTimeout(() => {
          shell.dataset.state = "off";
        }, 1500),
      );
    };

    const skip = () => {
      if (finished) return;
      if (!ignited) ignite(width / 2, height * 0.6);
      speed = Math.max(speed, ((1 - progress) * BURN_SECONDS) / SKIP_SECONDS);
    };
    skipRef.current = skip;

    const spawnEmber = () => {
      if (embers.length >= maxEmbers) return;
      for (let attempt = 0; attempt < 4; attempt += 1) {
        const k = (Math.random() * N) | 0;
        const x = cx + COS[k] * front[k];
        const y = cy + SIN[k] * front[k];
        if (x < -20 || x > width + 20 || y < -20 || y > height + 20) continue;
        const max = 0.7 + Math.random() * 1.7;
        const big = Math.random() < 0.08;
        embers.push({
          x: x + (Math.random() - 0.5) * 12,
          y: y + (Math.random() - 0.5) * 12,
          vx: COS[k] * 34 + (Math.random() - 0.5) * 80,
          vy: -60 - Math.random() * 190 + SIN[k] * 24,
          life: max,
          max,
          size: big ? 4 + Math.random() * 3 : 1.3 + Math.random() * 2.6,
          seed: Math.random() * 100,
        });
        return;
      }
    };

    function spawnFlake(x: number, y: number, angle: number, boost = 1) {
      if (flakes.length >= maxFlakes) return;
      const big = Math.random() < 0.15;
      flakes.push({
        x: x + (Math.random() - 0.5) * 16,
        y: y + (Math.random() - 0.5) * 16,
        vx: Math.cos(angle) * 40 * boost + (Math.random() - 0.5) * 60,
        vy: -40 - Math.random() * 110 * boost + Math.sin(angle) * 20,
        age: 0,
        life: 1.6 + Math.random() * 1.8,
        size: big ? 26 + Math.random() * 18 : 10 + Math.random() * 13,
        angle: Math.random() * TAU,
        spin: (Math.random() - 0.5) * 7,
        flipSpeed: 2 + Math.random() * 6,
        seed: Math.random() * 100,
      });
    }

    const spawnFrontFlake = () => {
      for (let attempt = 0; attempt < 4; attempt += 1) {
        const k = (Math.random() * N) | 0;
        const x = cx + COS[k] * front[k];
        const y = cy + SIN[k] * front[k];
        if (x < -20 || x > width + 20 || y < -20 || y > height + 20) continue;
        spawnFlake(x, y, Math.atan2(SIN[k], COS[k]));
        return;
      }
    };

    let flakeCarry = 0;
    const updateFlakes = (dt: number, t: number) => {
      if (ignited && !finished) {
        flakeCarry += (low ? 16 : 48) * dt;
        while (flakeCarry >= 1) {
          flakeCarry -= 1;
          spawnFrontFlake();
        }
      }
      let count = 0;
      for (let i = flakes.length - 1; i >= 0; i -= 1) {
        const f = flakes[i];
        f.age += dt;
        if (f.age >= f.life) {
          flakes[i] = flakes[flakes.length - 1];
          flakes.pop();
          continue;
        }
        // Light scraps flutter: drag, a rising draught and sideways gusts.
        f.vx += Math.sin(t * 1.9 + f.seed) * 70 * dt;
        f.vy += (-55 + Math.cos(t * 2.3 + f.seed * 1.7) * 40) * dt;
        f.vx *= 1 - 1.4 * dt;
        f.vy *= 1 - 0.9 * dt;
        f.x += f.vx * dt;
        f.y += f.vy * dt;
        f.angle += f.spin * dt;
        const life = f.age / f.life;
        const o = count * FLAKE_STRIDE;
        flakeData[o] = f.x;
        flakeData[o + 1] = f.y;
        flakeData[o + 2] = f.size;
        flakeData[o + 3] = Math.max(0, 1 - life * 1.9);
        flakeData[o + 4] = f.angle;
        flakeData[o + 5] = Math.cos(t * f.flipSpeed + f.seed);
        flakeData[o + 6] = f.seed;
        flakeData[o + 7] = Math.min(1, f.age * 6) * (1 - Math.max(0, (life - 0.6) / 0.4));
        count += 1;
      }
      return count;
    };

    // Before the fire: the light browns the paper and, held still, lights it.
    const updateGlass = (dt: number, now: number) => {
      const target = lightOn && !ignited ? 1 : 0;
      heat += (target - heat) * Math.min(1, dt * (target ? 5 : 9));
      if (ignited || !lightOn) {
        charge = Math.max(0, charge - dt * 2);
      } else {
        pointerSpeed *= Math.exp(-dt * 6);
        if (now - lastMoveAt > 80) pointerSpeed *= Math.exp(-dt * 10);
        const resting = pointerSpeed < 140;
        charge = resting ? Math.min(1, charge + dt / DWELL_SECONDS) : Math.max(0, charge - dt * 1.6);
        splat(mouseX, mouseY, 16 + 26 * charge, dt * (0.18 + 2.6 * charge * charge));
        if (charge > 0.55 && Math.random() < charge * 0.5 && embers.length < maxEmbers) {
          embers.push({
              x: mouseX + (Math.random() - 0.5) * 10,
              y: mouseY - 4,
              vx: (Math.random() - 0.5) * 50,
              vy: -40 - Math.random() * 90,
              life: 0.5 + Math.random() * 0.7,
              max: 1.2,
              size: 1.2 + Math.random() * 2,
            seed: Math.random() * 100,
          });
        }
        if (charge >= 1) ignite(mouseX, mouseY);
      }
      const lens = Math.round(charge * 40) / 40;
      if (lens !== lensShown) {
        lensShown = lens;
        html.style.setProperty("--lens", String(lens));
      }
    };

    const updateEmbers = (dt: number, t: number) => {
      if (ignited && !finished) {
        emitCarry += (low ? 130 : 360) * dt;
        while (emitCarry >= 1) {
          emitCarry -= 1;
          spawnEmber();
        }
      }
      let count = 0;
      for (let i = embers.length - 1; i >= 0; i -= 1) {
        const e = embers[i];
        e.life -= dt;
        if (e.life <= 0) {
          embers[i] = embers[embers.length - 1];
          embers.pop();
          continue;
        }
        e.vx += Math.sin(e.y * 0.018 + t * 2.2 + e.seed) * 95 * dt;
        e.vy += (-75 + Math.cos(e.x * 0.012 + t * 1.7 + e.seed) * 45) * dt;
        e.vx *= 1 - 0.9 * dt;
        e.vy *= 1 - 0.3 * dt;
        e.x += e.vx * dt;
        e.y += e.vy * dt;
        const heat = e.life / e.max;
        const o = count * 4;
        emberData[o] = e.x;
        emberData[o + 1] = e.y;
        emberData[o + 2] = e.size * (0.55 + 0.45 * heat);
        emberData[o + 3] = heat;
        count += 1;
      }
      return count;
    };

    const loop = () => {
      const now = performance.now();
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const t = now / 1000;
      try {
        if (ignited && !finished) {
          progress = Math.min(1, progress + (dt * speed) / BURN_SECONDS);
          computeFront(rMax * ease(progress));
          applyClip();
          heatLetters();
          if (progress >= 1) finish();
        }
        updateGlass(dt, now);
        const emberCount = updateEmbers(dt, t);
        const flakeCount = updateFlakes(dt, t);
        const flare = ignited ? Math.max(0, 1 - (now - ignitedAt) / 520) : 0;
        renderer?.render({
          time: t,
          cx,
          cy,
          flare,
          shock: ignited ? (now - ignitedAt) / 1000 : -1,
          ignited,
          front,
          drawBurn: !finished,
          embers: emberData,
          emberCount,
          flakes: flakeData,
          flakeCount,
          mouseX,
          mouseY,
          heat,
          charge,
          scorch,
          scorchW,
          scorchH,
          scorchDirty,
        });
        scorchDirty = false;
        if (finished && now - finishedAt > 1500) return;
      } catch (error) {
        console.error(error);
        finish();
        return;
      }
      raf = requestAnimationFrame(loop);
    };

    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerType === "touch" || ignited) return;
      const now = performance.now();
      if (lightOn) {
        const dt = Math.max(8, now - lastMoveAt) / 1000;
        const v = Math.hypot(event.clientX - mouseX, event.clientY - mouseY) / dt;
        pointerSpeed += (v - pointerSpeed) * 0.35;
      }
      mouseX = event.clientX;
      mouseY = event.clientY;
      lastMoveAt = now;
      lightOn = true;
    };
    const onPointerLeave = () => {
      lightOn = false;
    };
    const onPointerDown = (event: PointerEvent) => {
      if ((event.target as Element | null)?.closest(".intro__skip")) return;
      ignite(event.clientX, event.clientY);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") skip();
    };
    const onResize = () => {
      width = shell.clientWidth || window.innerWidth;
      height = shell.clientHeight || window.innerHeight;
      renderer?.resize(width, height, dpr);
      if (ignited) computeRMax();
      else allocScorch();
    };
    const resizeObserver = new ResizeObserver(onResize);
    resizeObserver.observe(shell);

    shell.addEventListener("pointerdown", onPointerDown);
    shell.addEventListener("pointermove", onPointerMove);
    shell.addEventListener("pointerleave", onPointerLeave);
    window.addEventListener("keydown", onKey);
    // Lights itself if nobody does. Someone playing with the burning glass gets
    // a little longer — and the fire then starts where their light is.
    const startedAt = performance.now();
    const autoIgnite = () => {
      if (ignited || finished) return;
      const now = performance.now();
      if (lightOn && now - lastMoveAt < 900 && now - startedAt < PLAY_IGNITE_MS) {
        timers.push(window.setTimeout(autoIgnite, 250));
        return;
      }
      if (lightOn) {
        ignite(mouseX, mouseY);
        return;
      }
      const button = site.querySelector<HTMLElement>("[data-ignite]")?.getBoundingClientRect();
      if (button && button.bottom > 0 && button.top < height) {
        ignite(button.left + button.width / 2, button.top + button.height / 2);
      } else {
        ignite(width / 2, height * 0.62);
      }
    };
    timers.push(window.setTimeout(autoIgnite, AUTO_IGNITE_MS));
    raf = requestAnimationFrame(loop);

    return () => {
      disposed = true;
      cancelAnimationFrame(afterFirstFrame);
      cancelIdle();
      cancelAnimationFrame(raf);
      timers.forEach((timer) => window.clearTimeout(timer));
      shell.removeEventListener("pointerdown", onPointerDown);
      shell.removeEventListener("pointermove", onPointerMove);
      shell.removeEventListener("pointerleave", onPointerLeave);
      html.style.removeProperty("--lens");
      window.removeEventListener("keydown", onKey);
      resizeObserver.disconnect();
      renderer?.destroy();
      skipRef.current = null;
      if (!finished) unlockScroll();
    };
  }, [run]);

  return (
    <div className="intro" ref={shellRef} data-cursor-lens="">
      <div className="intro__site-wrap">
        <div className="intro__site" ref={siteRef}>
          <OldSite />
        </div>
      </div>
      <canvas className="intro__canvas" ref={canvasRef} aria-hidden="true" />
      <div className="intro__ui">
        <p className="intro__hint" aria-hidden="true">
          <span className="intro__hint-fine">Hold the light still — or click — to set 2001 on fire</span>
          <span className="intro__hint-touch">Tap anywhere to set 2001 on fire</span>
        </p>
        <button type="button" className="intro__skip" onClick={() => skipRef.current?.()}>
          Skip intro <kbd>Esc</kbd>
        </button>
      </div>
    </div>
  );
}
