// Mouse-only flourishes: magnetic buttons, spotlight borders, a gentle 3D tilt
// on the featured project and the heat-reactive footer wordmark.

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

function wordmark(element: HTMLElement) {
  const letters = Array.from(element.children) as HTMLElement[];
  let centers: Array<{ x: number; y: number }> = [];
  const measure = () => {
    centers = letters.map((letter) => {
      const rect = letter.getBoundingClientRect();
      return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    });
  };
  const onEnter = () => measure();
  const onMove = (event: PointerEvent) => {
    if (!centers.length) measure();
    const reach = element.getBoundingClientRect().height * 0.9;
    letters.forEach((letter, index) => {
      const center = centers[index];
      const distance = Math.hypot(event.clientX - center.x, event.clientY - center.y);
      const heat = Math.max(0, 1 - distance / reach);
      letter.style.setProperty("--heat", (heat * heat).toFixed(3));
    });
  };
  const onLeave = () => {
    centers = [];
    letters.forEach((letter) => letter.style.setProperty("--heat", "0"));
  };
  element.addEventListener("pointerenter", onEnter);
  element.addEventListener("pointermove", onMove);
  element.addEventListener("pointerleave", onLeave);
  return () => {
    element.removeEventListener("pointerenter", onEnter);
    element.removeEventListener("pointermove", onMove);
    element.removeEventListener("pointerleave", onLeave);
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
  document.querySelectorAll<HTMLElement>("[data-wordmark]").forEach((element) => cleanups.push(wordmark(element)));
  return () => cleanups.forEach((cleanup) => cleanup());
}
