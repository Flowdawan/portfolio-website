"use client";

import { useEffect, useRef, useState } from "react";
import { detectSoftwareGL, isLowPower } from "@/lib/gl";
import { whenIdle } from "@/lib/idle";
import { heroChars, intro, resetForge, SEEN_KEY, sweepForge } from "@/lib/intro";
import { createNoise2D, fbm } from "@/lib/noise";
import { lockScroll, scrollToTarget, unlockScroll } from "@/lib/scroll";
import { createBurnLite } from "./burn-lite";
import { createBurnRenderer, FRONT_SAMPLES, type BurnRenderer } from "./burn-renderer";
import { OldSite } from "./OldSite";

const N = FRONT_SAMPLES;
const TAU = Math.PI * 2;
const AUTO_IGNITE_MS = 1650;
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
    shell.dataset.cursor = "Ignite";
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
    const timers: number[] = [];

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
      shell.removeAttribute("data-cursor");
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
        const emberCount = updateEmbers(dt, t);
        const flare = ignited ? Math.max(0, 1 - (now - ignitedAt) / 520) : 0;
        renderer?.render({ time: t, cx, cy, flare, front, drawBurn: ignited && !finished, embers: emberData, emberCount });
        if (finished && now - finishedAt > 1500) return;
      } catch (error) {
        console.error(error);
        finish();
        return;
      }
      raf = requestAnimationFrame(loop);
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
    };
    const resizeObserver = new ResizeObserver(onResize);
    resizeObserver.observe(shell);

    shell.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKey);
    timers.push(
      window.setTimeout(() => {
        const button = site.querySelector<HTMLElement>("[data-ignite]")?.getBoundingClientRect();
        if (button && button.bottom > 0 && button.top < height) {
          ignite(button.left + button.width / 2, button.top + button.height / 2);
        } else {
          ignite(width / 2, height * 0.62);
        }
      }, AUTO_IGNITE_MS),
    );
    raf = requestAnimationFrame(loop);

    return () => {
      disposed = true;
      cancelAnimationFrame(afterFirstFrame);
      cancelIdle();
      cancelAnimationFrame(raf);
      timers.forEach((timer) => window.clearTimeout(timer));
      shell.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKey);
      resizeObserver.disconnect();
      renderer?.destroy();
      skipRef.current = null;
      if (!finished) unlockScroll();
    };
  }, [run]);

  return (
    <div className="intro" ref={shellRef} data-cursor="Ignite">
      <div className="intro__site-wrap">
        <div className="intro__site" ref={siteRef}>
          <OldSite />
        </div>
      </div>
      <canvas className="intro__canvas" ref={canvasRef} aria-hidden="true" />
      <div className="intro__ui">
        <p className="intro__hint" aria-hidden="true">
          <span className="intro__hint-fine">Click anywhere to set 2001 on fire</span>
          <span className="intro__hint-touch">Tap anywhere to set 2001 on fire</span>
        </p>
        <button type="button" className="intro__skip" onClick={() => skipRef.current?.()}>
          Skip intro <kbd>Esc</kbd>
        </button>
      </div>
    </div>
  );
}
