import { sweepForge } from "@/lib/intro";

// Fire after the intro:
//  - [data-forge-scene] headlines arrive as cold ash and catch fire letter by
//    letter once they are well inside the viewport (once per visit)
//  - the footer wordmark sends a heat wave through its letters every time it
//    scrolls into view
export function initForgeScenes() {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const timers: number[] = [];

  const scenes = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.intersectionRatio < 0.6) continue;
        scenes.unobserve(entry.target);
        const scene = entry.target as HTMLElement;
        const chars = Array.from(scene.querySelectorAll<HTMLElement>("[data-forge]"));
        // Let the lines slide into place first, then ignite them.
        timers.push(
          window.setTimeout(
            () => {
              scene.classList.add("is-forging");
              if (reduced) chars.forEach((char) => char.classList.add("is-hot"));
              else sweepForge(chars, 34, 0);
            },
            reduced ? 0 : 650,
          ),
        );
      }
    },
    { threshold: 0.6 },
  );
  document.querySelectorAll("[data-forge-scene]").forEach((scene) => scenes.observe(scene));

  const wordmark = document.querySelector<HTMLElement>("[data-wordmark]");
  const wave = new IntersectionObserver(
    ([entry]) => {
      if (!wordmark || reduced) return;
      if (entry.intersectionRatio >= 0.55) wordmark.classList.add("is-waving");
      else if (!entry.isIntersecting) wordmark.classList.remove("is-waving");
    },
    { threshold: [0, 0.55] },
  );
  if (wordmark) wave.observe(wordmark);

  return () => {
    scenes.disconnect();
    wave.disconnect();
    timers.forEach((timer) => window.clearTimeout(timer));
  };
}
