import { onScroll } from "@/lib/scroll";

// Scroll-linked scenes, all driven from the single shared scroll source:
//  - [data-scroll-lit]  words light up as the statement moves through the viewport
//  - [data-fuse]        the timeline fuse burns down and ignites each milestone
//  - [data-stack-card]  stacked cards recede as the next one slides over them
// Only scenes near the viewport are measured, and each frame does all layout
// reads first, then all style writes.

const clamp = (value: number) => Math.min(1, Math.max(0, value));

export function initScenes() {
  const lit = Array.from(document.querySelectorAll<HTMLElement>("[data-scroll-lit]"));
  const fuses = Array.from(document.querySelectorAll<HTMLElement>("[data-fuse]")).map((element) => ({
    element,
    items: Array.from(element.querySelectorAll<HTMLElement>("[data-fuse-item]")),
    marks: [] as number[],
  }));
  const cards = Array.from(document.querySelectorAll<HTMLElement>("[data-stack-card]"));
  const stack = cards[0]?.parentElement ?? null;

  const near = new Set<Element>();
  const proximity = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => (entry.isIntersecting ? near.add(entry.target) : near.delete(entry.target)));
      update();
    },
    { rootMargin: "50% 0px" },
  );
  lit.forEach((element) => proximity.observe(element));
  fuses.forEach((fuse) => proximity.observe(fuse.element));
  if (stack) proximity.observe(stack);

  // Pause the line-art animations of cards that are off screen.
  const live = new IntersectionObserver((entries) => {
    entries.forEach((entry) => entry.target.classList.toggle("is-live", entry.isIntersecting));
  });
  cards.forEach((card) => live.observe(card));

  // Milestone positions are measured lazily, the first time a fuse comes near
  // (sections further down may not have been laid out yet).
  const measure = () => {
    for (const fuse of fuses) fuse.marks = [];
  };

  function update() {
    const height = window.innerHeight;
    const activeLit = lit.filter((element) => near.has(element));
    const activeFuses = fuses.filter((fuse) => near.has(fuse.element));
    const stackActive = Boolean(stack && near.has(stack));
    if (!activeLit.length && !activeFuses.length && !stackActive) return;

    const litRects = activeLit.map((element) => element.getBoundingClientRect());
    for (const fuse of activeFuses) {
      if (fuse.marks.length) continue;
      const total = fuse.element.offsetHeight || 1;
      fuse.marks = fuse.items.map((item) => (item.offsetTop + 14) / total);
    }
    const fuseRects = activeFuses.map((fuse) => fuse.element.getBoundingClientRect());
    const cardRects = stackActive ? cards.map((card) => card.getBoundingClientRect()) : [];

    activeLit.forEach((element, index) => {
      const rect = litRects[index];
      const progress = clamp((height * 0.85 - rect.top) / (rect.height + height * 0.25));
      element.style.setProperty("--p", progress.toFixed(4));
    });

    activeFuses.forEach((fuse, index) => {
      const rect = fuseRects[index];
      const progress = clamp((height * 0.6 - rect.top) / rect.height);
      fuse.element.style.setProperty("--p", progress.toFixed(4));
      fuse.items.forEach((item, itemIndex) => {
        item.classList.toggle("is-lit", progress >= fuse.marks[itemIndex]);
      });
    });

    for (let i = 0; i < cardRects.length - 1; i += 1) {
      const cover = clamp((cardRects[i].bottom - cardRects[i + 1].top) / cardRects[i].height);
      cards[i].style.setProperty("--cover", cover.toFixed(3));
    }
  }

  const onResize = () => {
    measure();
    update();
  };

  measure();
  const off = onScroll(update);
  window.addEventListener("resize", onResize);
  const settle = window.setTimeout(onResize, 900);

  return () => {
    off();
    proximity.disconnect();
    live.disconnect();
    window.clearTimeout(settle);
    window.removeEventListener("resize", onResize);
  };
}
