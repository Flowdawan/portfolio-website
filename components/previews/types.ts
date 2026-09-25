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

export const INK = {
  bg: "#100d0b",
  bone: "#f3ede4",
  ember: "#ff6a2b",
  amber: "#ffb65c",
  deep: "#d93a14",
};

export function monoFont(size: number, weight = 500) {
  const family =
    typeof document === "undefined"
      ? ""
      : getComputedStyle(document.documentElement).getPropertyValue("--font-mono").trim();
  return `${weight} ${size}px ${family || "ui-monospace, monospace"}`;
}
