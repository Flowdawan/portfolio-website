// Shared contract + palette for the live project thumbnails.

export type Sketch = {
  resize: (width: number, height: number) => void;
  step: (dt: number) => void;
  draw: () => void;
  /** Pointer position in canvas CSS pixels, or null when the pointer leaves. */
  pointer: (x: number | null, y?: number) => void;
  /** Advance the simulation off-screen so a single static frame looks alive. */
  warmup?: () => void;
};

export type SketchFactory = (ctx: CanvasRenderingContext2D) => Sketch;

// Ink on paper, like the rest of the site: `bone` is the drawing colour.
export const INK = {
  bg: "#e5e0d6",
  bone: "#141210",
  ember: "#e0401b",
  amber: "#e0401b",
  deep: "#b8300f",
};

export function monoFont(size: number, weight = 500) {
  const family =
    typeof document === "undefined"
      ? ""
      : getComputedStyle(document.documentElement).getPropertyValue("--font-mono").trim();
  return `${weight} ${size}px ${family || "ui-monospace, monospace"}`;
}
