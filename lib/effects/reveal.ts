// One shared IntersectionObserver for every `[data-reveal]` element. Hidden
// states only apply once the page is hydrated (`html.hydrated`), so content is
// never lost if JavaScript fails. That class is added after the observer's first
// report, when everything already on screen has been marked visible — no flash,
// and no forced layout of sections that are still skipped by content-visibility.
export function initReveals() {
  const elements = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
  let ready = false;
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add("is-in");
        observer.unobserve(entry.target);
      }
      if (!ready) {
        ready = true;
        document.documentElement.classList.add("hydrated");
      }
    },
    { rootMargin: "0px 0px -10% 0px", threshold: 0.06 },
  );
  elements.forEach((element) => observer.observe(element));
  if (!elements.length) document.documentElement.classList.add("hydrated");
  return () => observer.disconnect();
}
