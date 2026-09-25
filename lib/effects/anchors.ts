import { scrollToTarget } from "@/lib/scroll";

// In-page links glide instead of jumping. Keyboard activation also moves focus
// to the target so the next Tab continues from there.
export function initAnchors() {
  const onClick = (event: MouseEvent) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }
    const link = (event.target as Element | null)?.closest<HTMLAnchorElement>('a[href^="#"]');
    if (!link) return;
    const id = decodeURIComponent(link.hash.slice(1));
    const target = id ? document.getElementById(id) : null;
    if (!target) return;

    event.preventDefault();
    scrollToTarget(id === "home" ? 0 : target);
    history.replaceState(null, "", id === "home" ? window.location.pathname : `#${id}`);

    if (event.detail === 0) {
      if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
      target.focus({ preventScroll: true });
    }
  };

  document.addEventListener("click", onClick);
  return () => document.removeEventListener("click", onClick);
}
