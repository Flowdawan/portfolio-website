// Tiny shared state for the burn intro, so the navigation, the hero and the
// ember field can react to it without prop drilling or a React context.

export type IntroPhase = "pending" | "burning" | "done";

type Listener = (phase: IntroPhase) => void;

let phase: IntroPhase = "pending";
const listeners = new Set<Listener>();
const replayListeners = new Set<() => void>();

export const SEEN_KEY = "deflow:intro-seen";

export const intro = {
  get phase() {
    return phase;
  },
  set(next: IntroPhase) {
    if (next === phase) return;
    phase = next;
    listeners.forEach((listener) => listener(phase));
  },
  subscribe(listener: Listener) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  /** Ask the intro component to burn the 2001 page down once more. */
  replay() {
    replayListeners.forEach((listener) => listener());
  },
  onReplay(listener: () => void) {
    replayListeners.add(listener);
    return () => {
      replayListeners.delete(listener);
    };
  },
};

/** The hero letters the burn heats (the contact headline has its own scene). */
export function heroChars() {
  return Array.from(document.querySelectorAll<HTMLElement>("#home [data-forge]"));
}

/**
 * Heats letters one after another in reading order — a wave rather than a
 * flash, because each letter only turns white-hot when its turn comes.
 */
export function sweepForge(chars: HTMLElement[], step = 26, delay = 120) {
  const pending = chars.filter((char) => !char.classList.contains("is-hot"));
  if (!pending.length) return;
  const start = performance.now() + delay;
  let index = 0;
  const tick = (now: number) => {
    while (index < pending.length && now >= start + index * step) {
      pending[index].classList.add("is-hot");
      index += 1;
    }
    if (index < pending.length) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

export function resetForge(chars = heroChars()) {
  chars.forEach((char) => char.classList.remove("is-hot"));
}
