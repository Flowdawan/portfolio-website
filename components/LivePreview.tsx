"use client";

import { useEffect, useRef } from "react";
import type { PreviewKind } from "@/data/portfolio";
import type { Sketch, SketchFactory } from "./previews/types";

// Hosts one live sketch. The sketch code is split into its own chunk and only
// fetched when the card approaches the viewport; the loop runs only while the
// card is visible and the tab is active.

const loaders: Record<PreviewKind, () => Promise<{ create: SketchFactory }>> = {
  perceptron: () => import("./previews/perceptron"),
  marble: () => import("./previews/marble"),
  ink: () => import("./previews/ink"),
  bits: () => import("./previews/bits"),
};

export function LivePreview({ kind }: { kind: PreviewKind }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D | null = null;
    const host = canvas.closest<HTMLElement>("[data-preview-host]") ?? canvas.parentElement ?? canvas;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let sketch: Sketch | null = null;
    let visible = false;
    let loading = false;
    let disposed = false;
    let raf = 0;
    let last = 0;
    let width = 0;
    let height = 0;

    // Sizes come from the ResizeObserver (no forced layout), and the backing
    // store is only allocated once the sketch has actually been loaded.
    const resize = () => {
      if (!sketch || !ctx || !width || !height) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      sketch.resize(width, height);
      if (reduced) sketch.warmup?.();
      sketch.draw();
    };

    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      sketch?.step(dt);
      sketch?.draw();
      raf = requestAnimationFrame(loop);
    };

    const start = () => {
      if (!sketch || reduced || raf || !visible || document.hidden) return;
      last = performance.now();
      raf = requestAnimationFrame(loop);
    };

    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };

    const load = async () => {
      loading = true;
      const { create } = await loaders[kind]();
      if (disposed) return;
      ctx = canvas.getContext("2d", { alpha: false });
      if (!ctx) return;
      sketch = create(ctx);
      resize();
      host.dataset.previewReady = "true";
      start();
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible && !sketch && !loading) void load();
        if (visible) start();
        else stop();
      },
      { rootMargin: "240px 0px" },
    );
    observer.observe(canvas);

    const resizeObserver = new ResizeObserver(([entry]) => {
      width = entry.contentRect.width;
      height = entry.contentRect.height;
      resize();
    });
    resizeObserver.observe(canvas);

    const onMove = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      sketch?.pointer(event.clientX - rect.left, event.clientY - rect.top);
    };
    const onLeave = () => sketch?.pointer(null);
    const onVisibility = () => (document.hidden ? stop() : start());
    host.addEventListener("pointermove", onMove);
    host.addEventListener("pointerleave", onLeave);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      disposed = true;
      stop();
      observer.disconnect();
      resizeObserver.disconnect();
      host.removeEventListener("pointermove", onMove);
      host.removeEventListener("pointerleave", onLeave);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [kind]);

  return <canvas ref={canvasRef} className="preview-canvas" aria-hidden="true" />;
}
