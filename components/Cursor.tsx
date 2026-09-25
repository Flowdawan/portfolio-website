"use client";

import { useEffect, useRef } from "react";

// An ember-dot cursor with a trailing ring that grows over interactive elements
// and shows a short label for anything carrying `data-cursor`. Only enabled for
// real mice; the loop sleeps as soon as the ring has caught up.

export function Cursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const dot = dotRef.current;
    const ring = ringRef.current;
    const label = labelRef.current;
    if (!dot || !ring || !label) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const html = document.documentElement;
    html.classList.add("has-cursor");

    let x = -100;
    let y = -100;
    let rx = -100;
    let ry = -100;
    let raf = 0;
    let shown = false;
    let pressed = false;
    let mode = "";

    const render = () => {
      const follow = reduced ? 1 : 0.2;
      rx += (x - rx) * follow;
      ry += (y - ry) * follow;
      dot.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      ring.style.transform = `translate3d(${rx}px, ${ry}px, 0)`;
      if (Math.abs(x - rx) + Math.abs(y - ry) > 0.1) raf = requestAnimationFrame(render);
      else raf = 0;
    };
    const kick = () => {
      if (!raf) raf = requestAnimationFrame(render);
    };

    const setMode = (next: string, text = "") => {
      if (next === mode && label.textContent === text) return;
      mode = next;
      ring.dataset.mode = next;
      label.textContent = text;
    };

    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      x = event.clientX;
      y = event.clientY;
      if (!shown) {
        shown = true;
        rx = x;
        ry = y;
        html.dataset.cursorState = "on";
      }
      kick();
    };

    const evaluate = (target: Element | null) => {
      const labelled = target?.closest<HTMLElement>("[data-cursor]");
      if (labelled?.dataset.cursor) {
        setMode("label", labelled.dataset.cursor);
        return;
      }
      if (target?.closest("a, button, [role='button'], label")) {
        setMode("link");
        return;
      }
      setMode("");
    };
    const onOver = (event: PointerEvent) => evaluate(event.target as Element | null);
    // Attributes can change under a resting pointer (e.g. once the fire is lit).
    const onRefresh = () => {
      if (shown) evaluate(document.elementFromPoint(x, y));
    };

    const onDown = () => {
      pressed = true;
      ring.dataset.pressed = String(pressed);
    };
    const onUp = () => {
      pressed = false;
      ring.dataset.pressed = String(pressed);
    };
    const onLeave = () => {
      shown = false;
      html.dataset.cursorState = "off";
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerover", onOver, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("pointerup", onUp, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    window.addEventListener("cursor:refresh", onRefresh);

    return () => {
      cancelAnimationFrame(raf);
      html.classList.remove("has-cursor");
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerover", onOver);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("cursor:refresh", onRefresh);
    };
  }, []);

  return (
    <div className="cursor" aria-hidden="true">
      <div className="cursor__ring" ref={ringRef}>
        <span className="cursor__label" ref={labelRef} />
      </div>
      <div className="cursor__dot" ref={dotRef} />
    </div>
  );
}
