"use client";

import { useEffect, useRef } from "react";
import { detectSoftwareGL, isLowPower } from "@/lib/gl";
import { whenIdle } from "@/lib/idle";
import { onScroll } from "@/lib/scroll";
import { createSwarmRenderer, type SwarmRenderer } from "./swarm-renderer";

// Drives the pinned expertise film: scroll position → which form the embers
// take, which discipline is on screen and how far the rail has burned. The
// pinned layout itself is decided before first paint (html.swarm-ok, set by the
// boot script when WebGL2 exists and motion is welcome), so nothing jumps when
// the renderer arrives; without it the section stays a plain list with line
// drawings.

const STAGES = 4;
const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const smooth = (edge0: number, edge1: number, x: number) => {
  const t = clamp((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
};

/** Scroll progress (0–1) → form index with a plateau for every discipline. */
function stageAt(progress: number) {
  let stage = 0;
  for (let k = 1; k < STAGES; k += 1) stage += smooth(k / STAGES - 0.085, k / STAGES + 0.085, progress);
  return stage;
}

export function SwarmCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const root = canvas?.closest<HTMLElement>("[data-swarm]");
    if (!canvas || !root) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const stages = Array.from(root.querySelectorAll<HTMLElement>("[data-swarm-stage]"));
    const ticks = Array.from(root.querySelectorAll<HTMLElement>("[data-swarm-tick]"));
    let renderer: SwarmRenderer | null = null;
    let disposed = false;
    let raf = 0;
    let running = false;
    let visible = false;
    let width = 1;
    let height = 1;
    let dpr = 1;
    let compact = false;

    let progress = 0;
    let gather = 0;
    let stage = 0;
    let shownStage = -1;
    let mouseX = -9999;
    let mouseY = -9999;
    let aimX = 0;
    let aimY = 0;
    let lookX = 0;
    let lookY = 0;
    let last = performance.now();
    const start = last;

    const measure = () => {
      const rect = root.getBoundingClientRect();
      const vh = window.innerHeight;
      const travel = Math.max(1, rect.height - vh);
      progress = clamp(-rect.top / travel);
      gather = clamp((vh - rect.top) / (vh * 0.95));
    };

    const setActive = (index: number) => {
      if (index === shownStage) return;
      shownStage = index;
      stages.forEach((element, i) => element.toggleAttribute("data-active", i === index));
      ticks.forEach((element, i) => element.toggleAttribute("data-active", i <= index));
    };

    const resize = () => {
      width = canvas.clientWidth || window.innerWidth;
      height = canvas.clientHeight || window.innerHeight;
      compact = width < 900;
      renderer?.resize(width, height, dpr);
    };

    const frame = (now: number) => {
      raf = 0;
      if (!renderer || !visible || document.hidden) {
        running = false;
        return;
      }
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const t = (now - start) / 1000;

      // The displayed form chases the scroll target, so fast flicks still morph.
      const target = stageAt(progress);
      stage += (target - stage) * Math.min(1, dt * 5.5);
      if (Math.abs(target - stage) < 0.0005) stage = target;
      setActive(Math.round(stage));
      root.style.setProperty("--swarm-p", progress.toFixed(4));

      lookX += (aimX - lookX) * Math.min(1, dt * 3);
      lookY += (aimY - lookY) * Math.min(1, dt * 3);

      const centerX = compact ? width * 0.5 : width * 0.66;
      const centerY = compact ? height * 0.31 : height * 0.5;
      const scale = compact ? Math.min(width * 0.29, height * 0.15) : Math.min(width * 0.215, height * 0.32);
      renderer.render({
        time: t,
        stage,
        gather,
        rot: Math.sin(t * 0.22) * 0.32 + lookX * 0.4,
        tilt: Math.sin(t * 0.17) * 0.1 + lookY * 0.25,
        fade: 1,
        centerX,
        centerY,
        scale,
        mouseX,
        mouseY,
      });
      running = true;
      raf = requestAnimationFrame(frame);
    };

    const wake = () => {
      if (running || !renderer || !visible) return;
      running = true;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    };

    const offScroll = onScroll(() => {
      measure();
      wake();
    });
    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible) {
          measure();
          wake();
        }
      },
      { rootMargin: "20% 0px" },
    );
    observer.observe(root);

    const onPointer = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      const rect = canvas.getBoundingClientRect();
      mouseX = event.clientX - rect.left;
      mouseY = event.clientY - rect.top;
      aimX = (event.clientX / window.innerWidth - 0.5) * 2;
      aimY = (event.clientY / window.innerHeight - 0.5) * 2;
    };
    const onLeave = () => {
      mouseX = -9999;
      mouseY = -9999;
    };
    const onVisibility = () => {
      if (!document.hidden) wake();
    };
    const resizeObserver = new ResizeObserver(() => {
      resize();
      measure();
    });

    const cancelIdle = whenIdle(async () => {
      const software = await detectSoftwareGL();
      if (disposed) return;
      const low = isLowPower();
      dpr = software || low ? 1 : Math.min(window.devicePixelRatio || 1, 1.75);
      const count = software ? 5000 : low ? 9000 : 18000;
      const created = await createSwarmRenderer(canvas, count);
      if (disposed) {
        created?.destroy();
        return;
      }
      if (!created) {
        // No usable WebGL after all: fall back to the plain list.
        document.documentElement.classList.remove("swarm-ok");
        return;
      }
      renderer = created;
      resize();
      measure();
      stage = stageAt(progress);
      root.classList.add("is-live");
      resizeObserver.observe(canvas);
      window.addEventListener("pointermove", onPointer, { passive: true });
      document.addEventListener("pointerleave", onLeave);
      document.addEventListener("visibilitychange", onVisibility);
      wake();
    }, 2500);

    return () => {
      disposed = true;
      cancelIdle();
      cancelAnimationFrame(raf);
      offScroll();
      observer.disconnect();
      resizeObserver.disconnect();
      window.removeEventListener("pointermove", onPointer);
      document.removeEventListener("pointerleave", onLeave);
      document.removeEventListener("visibilitychange", onVisibility);
      root.classList.remove("is-live");
      renderer?.destroy();
    };
  }, []);

  return <canvas ref={canvasRef} className="swarm__canvas" aria-hidden="true" />;
}
