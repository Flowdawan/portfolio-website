// Sparks: a fast-moving cursor throws a few off, clicks and taps set off a small
// burst. One canvas above the page, created on first use; its loop only runs
// while sparks are alive and the canvas is cleared as soon as the last one dies.

type Spark = { x: number; y: number; vx: number; vy: number; life: number; max: number; width: number };

const MAX_SPARKS = 160;
const TRAIL_SPEED = 1500; // px/s before the cursor starts to shed sparks

function sparkColor(heat: number, alpha: number) {
  if (heat > 0.72) return `rgba(255, 240, 214, ${alpha})`;
  if (heat > 0.42) return `rgba(255, 168, 82, ${alpha})`;
  return `rgba(236, 82, 30, ${alpha})`;
}

export function initSparks() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return () => undefined;

  const sparks: Spark[] = [];
  let canvas: HTMLCanvasElement | null = null;
  let ctx: CanvasRenderingContext2D | null = null;
  let width = 0;
  let height = 0;
  let raf = 0;
  let last = 0;

  const resize = () => {
    if (!canvas || !ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  const ensureCanvas = () => {
    if (ctx) return true;
    canvas = document.createElement("canvas");
    canvas.className = "sparks";
    canvas.setAttribute("aria-hidden", "true");
    document.body.appendChild(canvas);
    ctx = canvas.getContext("2d");
    resize();
    return Boolean(ctx);
  };

  // The burn intro has sparks of its own.
  const blocked = () => document.documentElement.classList.contains("is-intro");

  const spawn = (x: number, y: number, vx: number, vy: number, life: number, width: number) => {
    if (sparks.length >= MAX_SPARKS) return;
    sparks.push({ x, y, vx, vy, life, max: life, width });
  };

  const frame = (now: number) => {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (!ctx) {
      raf = 0;
      return;
    }
    ctx.clearRect(0, 0, width, height);
    ctx.globalCompositeOperation = "lighter";
    ctx.lineCap = "round";
    for (let i = sparks.length - 1; i >= 0; i -= 1) {
      const spark = sparks[i];
      spark.life -= dt;
      if (spark.life <= 0) {
        sparks[i] = sparks[sparks.length - 1];
        sparks.pop();
        continue;
      }
      // Drag, then the hot air carries them upwards.
      spark.vx *= 1 - 3.2 * dt;
      spark.vy = spark.vy * (1 - 3.2 * dt) - 150 * dt;
      spark.x += spark.vx * dt;
      spark.y += spark.vy * dt;
      const heat = spark.life / spark.max;
      ctx.strokeStyle = sparkColor(heat, Math.min(1, heat * 1.6));
      ctx.lineWidth = spark.width * (0.45 + 0.55 * heat);
      ctx.beginPath();
      ctx.moveTo(spark.x, spark.y);
      ctx.lineTo(spark.x - spark.vx * 0.028, spark.y - spark.vy * 0.028);
      ctx.stroke();
    }
    ctx.globalCompositeOperation = "source-over";
    if (sparks.length) {
      raf = requestAnimationFrame(frame);
    } else {
      raf = 0;
      ctx.clearRect(0, 0, width, height);
    }
  };

  const kick = () => {
    if (raf || !sparks.length || !ensureCanvas()) return;
    last = performance.now();
    raf = requestAnimationFrame(frame);
  };

  let lastX = 0;
  let lastY = 0;
  let lastTime = 0;
  let carry = 0;
  const onMove = (event: PointerEvent) => {
    if (event.pointerType !== "mouse") return;
    const time = event.timeStamp;
    const dt = Math.max(8, time - lastTime) / 1000;
    const vx = (event.clientX - lastX) / dt;
    const vy = (event.clientY - lastY) / dt;
    const fresh = time - lastTime < 120;
    lastX = event.clientX;
    lastY = event.clientY;
    lastTime = time;
    const speed = Math.hypot(vx, vy);
    if (!fresh || speed < TRAIL_SPEED || blocked()) return;
    carry += Math.min(3, (speed - TRAIL_SPEED) / 900);
    while (carry >= 1) {
      carry -= 1;
      spawn(
        event.clientX,
        event.clientY,
        vx * 0.1 + (Math.random() - 0.5) * 120,
        vy * 0.1 + (Math.random() - 0.5) * 120 - 40,
        0.35 + Math.random() * 0.4,
        1.1 + Math.random() * 0.9,
      );
    }
    kick();
  };

  const onDown = (event: PointerEvent) => {
    if (blocked() || event.button > 0) return;
    const count = event.pointerType === "mouse" ? 14 : 9;
    for (let i = 0; i < count; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 140 + Math.random() * 300;
      spawn(
        event.clientX,
        event.clientY,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed - 90,
        0.4 + Math.random() * 0.45,
        1.2 + Math.random() * 1.1,
      );
    }
    kick();
  };

  window.addEventListener("pointermove", onMove, { passive: true });
  window.addEventListener("pointerdown", onDown, { passive: true });
  window.addEventListener("resize", resize);

  return () => {
    cancelAnimationFrame(raf);
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerdown", onDown);
    window.removeEventListener("resize", resize);
    canvas?.remove();
  };
}
