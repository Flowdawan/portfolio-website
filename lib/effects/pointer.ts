// Mouse-only flourishes: magnetic buttons, spotlight borders, a gentle 3D tilt
// on the featured project, and letters that re-heat under the cursor.

function magnetic(element: HTMLElement) {
  let tx = 0;
  let ty = 0;
  let x = 0;
  let y = 0;
  let raf = 0;

  const loop = () => {
    x += (tx - x) * 0.2;
    y += (ty - y) * 0.2;
    element.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0)`;
    if (Math.abs(tx - x) + Math.abs(ty - y) > 0.05) {
      raf = requestAnimationFrame(loop);
    } else {
      raf = 0;
      if (!tx && !ty) element.style.transform = "";
    }
  };
  const kick = () => {
    if (!raf) raf = requestAnimationFrame(loop);
  };
  const onMove = (event: PointerEvent) => {
    const rect = element.getBoundingClientRect();
    tx = (event.clientX - (rect.left + rect.width / 2)) * 0.28;
    ty = (event.clientY - (rect.top + rect.height / 2)) * 0.38;
    kick();
  };
  const onLeave = () => {
    tx = 0;
    ty = 0;
    kick();
  };
  element.addEventListener("pointermove", onMove);
  element.addEventListener("pointerleave", onLeave);
  return () => {
    cancelAnimationFrame(raf);
    element.removeEventListener("pointermove", onMove);
    element.removeEventListener("pointerleave", onLeave);
    element.style.transform = "";
  };
}

function spotlight(element: HTMLElement) {
  const onMove = (event: PointerEvent) => {
    const rect = element.getBoundingClientRect();
    element.style.setProperty("--mx", `${(((event.clientX - rect.left) / rect.width) * 100).toFixed(2)}%`);
    element.style.setProperty("--my", `${(((event.clientY - rect.top) / rect.height) * 100).toFixed(2)}%`);
  };
  element.addEventListener("pointermove", onMove);
  return () => element.removeEventListener("pointermove", onMove);
}

function tilt(element: HTMLElement) {
  const onMove = (event: PointerEvent) => {
    const rect = element.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width - 0.5;
    const py = (event.clientY - rect.top) / rect.height - 0.5;
    element.style.setProperty("--tilt-x", `${(-py * 4).toFixed(3)}deg`);
    element.style.setProperty("--tilt-y", `${(px * 5).toFixed(3)}deg`);
    element.style.setProperty("--mx", `${((px + 0.5) * 100).toFixed(2)}%`);
    element.style.setProperty("--my", `${((py + 0.5) * 100).toFixed(2)}%`);
  };
  const onLeave = () => {
    element.style.setProperty("--tilt-x", "0deg");
    element.style.setProperty("--tilt-y", "0deg");
  };
  element.addEventListener("pointermove", onMove);
  element.addEventListener("pointerleave", onLeave);
  return () => {
    element.removeEventListener("pointermove", onMove);
    element.removeEventListener("pointerleave", onLeave);
  };
}

/**
 * Letters that glow when the cursor comes close: the forged hero headline and
 * the footer wordmark. Letter centres are cached relative to their container,
 * so scrolling (and the hero's parallax) never invalidates them; updates are
 * batched into one frame and only touch letters whose glow really changed.
 * `target` is the element that listens for the pointer.
 */
function heatField(
  container: HTMLElement,
  letters: HTMLElement[],
  reachFactor: number,
  power: number,
  target: HTMLElement = container,
) {
  let offsets: Array<{ x: number; y: number }> = [];
  let reach = 1;
  let pointerX = 0;
  let pointerY = 0;
  let raf = 0;
  const current = new Float32Array(letters.length);

  const measure = () => {
    const box = container.getBoundingClientRect();
    offsets = letters.map((letter) => {
      const rect = letter.getBoundingClientRect();
      return { x: rect.left + rect.width / 2 - box.left, y: rect.top + rect.height / 2 - box.top };
    });
    reach = parseFloat(getComputedStyle(container).fontSize) * reachFactor;
  };

  const set = (index: number, value: number) => {
    if (Math.abs(value - current[index]) < 0.015 && value !== 0) return;
    if (value === 0 && current[index] === 0) return;
    current[index] = value;
    letters[index].style.setProperty("--glow", value.toFixed(3));
  };

  const update = () => {
    raf = 0;
    if (document.documentElement.classList.contains("is-intro")) return;
    if (!offsets.length) measure();
    const box = container.getBoundingClientRect();
    offsets.forEach((offset, index) => {
      const distance = Math.hypot(pointerX - (box.left + offset.x), pointerY - (box.top + offset.y));
      const heat = Math.max(0, 1 - distance / reach);
      set(index, heat > 0 ? Math.pow(heat, power) : 0);
    });
  };

  const onMove = (event: PointerEvent) => {
    pointerX = event.clientX;
    pointerY = event.clientY;
    if (!raf) raf = requestAnimationFrame(update);
  };
  const onLeave = () => {
    cancelAnimationFrame(raf);
    raf = 0;
    letters.forEach((_, index) => set(index, 0));
  };
  const onResize = () => {
    offsets = [];
  };

  target.addEventListener("pointermove", onMove);
  target.addEventListener("pointerleave", onLeave);
  window.addEventListener("resize", onResize);
  return () => {
    cancelAnimationFrame(raf);
    target.removeEventListener("pointermove", onMove);
    target.removeEventListener("pointerleave", onLeave);
    window.removeEventListener("resize", onResize);
  };
}

export function initPointerEffects() {
  if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return () => undefined;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const cleanups: Array<() => void> = [];
  if (!reduced) {
    document.querySelectorAll<HTMLElement>("[data-magnetic]").forEach((element) => cleanups.push(magnetic(element)));
    document.querySelectorAll<HTMLElement>("[data-tilt]").forEach((element) => cleanups.push(tilt(element)));
  }
  document.querySelectorAll<HTMLElement>("[data-spotlight]").forEach((element) => cleanups.push(spotlight(element)));
  document.querySelectorAll<HTMLElement>("[data-wordmark]").forEach((element) => {
    cleanups.push(heatField(element, Array.from(element.children) as HTMLElement[], 0.75, 2));
  });
  // The whole hero listens, so letters warm up as the cursor approaches them.
  const hero = document.getElementById("home");
  const heroTitle = hero?.querySelector<HTMLElement>(".hero__title");
  if (hero && heroTitle) {
    const letters = Array.from(heroTitle.querySelectorAll<HTMLElement>("[data-forge]"));
    cleanups.push(heatField(heroTitle, letters, 1.25, 1.6, hero));
  }
  return () => cleanups.forEach((cleanup) => cleanup());
}
