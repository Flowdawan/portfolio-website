import Lenis from "lenis";

// One shared scroll source for every scroll-linked effect. Lenis smooths wheel
// input on desktop; touch devices and reduced-motion users keep native scrolling
// (Lenis passes those through and still reports the position).

type ScrollListener = (y: number, velocity: number) => void;

let lenis: Lenis | null = null;
let locked = false;
let nativeFrame = 0;
let lastNativeY = 0;
const listeners = new Set<ScrollListener>();

function emit(y: number, velocity: number) {
  listeners.forEach((listener) => listener(y, velocity));
}

function onNativeScroll() {
  if (nativeFrame) return;
  nativeFrame = requestAnimationFrame(() => {
    nativeFrame = 0;
    const y = window.scrollY;
    emit(y, y - lastNativeY);
    lastNativeY = y;
  });
}

export function initScroll() {
  if (lenis) return () => undefined;

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!reduced) {
    lenis = new Lenis({
      autoRaf: true,
      lerp: 0.095,
      smoothWheel: true,
      wheelMultiplier: 0.95,
      stopInertiaOnNavigate: true,
    });
    lenis.on("scroll", (instance: Lenis) => emit(instance.scroll, instance.velocity));
    if (locked) lenis.stop();
  } else {
    window.addEventListener("scroll", onNativeScroll, { passive: true });
  }

  return () => {
    lenis?.destroy();
    lenis = null;
    window.removeEventListener("scroll", onNativeScroll);
    if (nativeFrame) cancelAnimationFrame(nativeFrame);
  };
}

export function onScroll(listener: ScrollListener) {
  listeners.add(listener);
  listener(getScrollY(), 0);
  return () => {
    listeners.delete(listener);
  };
}

export function getScrollY() {
  return lenis ? lenis.scroll : typeof window === "undefined" ? 0 : window.scrollY;
}

export function lockScroll() {
  locked = true;
  lenis?.stop();
}

export function unlockScroll() {
  locked = false;
  lenis?.start();
}

export function scrollToTarget(target: HTMLElement | number, options: { immediate?: boolean; offset?: number } = {}) {
  const { immediate = false, offset = 0 } = options;
  if (lenis) {
    lenis.scrollTo(target, { immediate, offset, force: true, duration: 1.35 });
    return;
  }
  const top = typeof target === "number" ? target : target.getBoundingClientRect().top + window.scrollY + offset;
  window.scrollTo({ top, behavior: immediate ? "auto" : "smooth" });
}
