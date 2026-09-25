import { onScroll } from "@/lib/scroll";

// The expertise marquee drifts on its own, speeds up with scroll velocity and
// turns around when you scroll back up. Runs only while it is on screen.
export function initMarquee() {
  const marquee = document.querySelector<HTMLElement>("[data-marquee]");
  const track = marquee?.querySelector<HTMLElement>(".marquee__track");
  const group = track?.firstElementChild as HTMLElement | null | undefined;
  if (!marquee || !track || !group) return () => undefined;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return () => undefined;

  let x = 0;
  let velocity = 0;
  let direction = -1;
  let width = 0;
  let raf = 0;
  let last = 0;

  const loop = (now: number) => {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const speed = 42 + Math.min(1400, Math.abs(velocity) * 36);
    x += direction * speed * dt;
    if (width) {
      if (x <= -width) x += width;
      if (x > 0) x -= width;
    }
    track.style.transform = `translate3d(${x.toFixed(2)}px, 0, 0)`;
    velocity *= 0.9;
    raf = requestAnimationFrame(loop);
  };

  const observer = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting && !raf) {
      if (!width) width = group.getBoundingClientRect().width;
      last = performance.now();
      raf = requestAnimationFrame(loop);
    } else if (!entry.isIntersecting && raf) {
      cancelAnimationFrame(raf);
      raf = 0;
    }
  });
  observer.observe(marquee);

  const off = onScroll((_, v) => {
    if (Math.abs(v) > 0.2) {
      velocity = v;
      direction = v > 0 ? -1 : 1;
    }
  });
  const onResize = () => {
    width = group.getBoundingClientRect().width;
  };
  window.addEventListener("resize", onResize);

  return () => {
    cancelAnimationFrame(raf);
    observer.disconnect();
    off();
    window.removeEventListener("resize", onResize);
  };
}
