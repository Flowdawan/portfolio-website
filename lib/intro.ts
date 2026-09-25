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

/** Heats the hero letters in reading order when there is no fire to do it. */
export function sweepForge(delayStep = 26) {
  const chars = Array.from(document.querySelectorAll<HTMLElement>("[data-forge]"));
  chars.forEach((char, index) => {
    if (char.classList.contains("is-hot")) return;
    char.style.animationDelay = `${120 + index * delayStep}ms`;
    char.classList.add("is-hot");
  });
}

export function resetForge() {
  document.querySelectorAll<HTMLElement>("[data-forge]").forEach((char) => {
    char.classList.remove("is-hot");
    char.style.animationDelay = "";
  });
}
