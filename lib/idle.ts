/** Runs a callback when the browser is idle (or after a timeout at the latest). */
export function whenIdle(callback: () => void, timeout = 1200) {
  // Safari only recently gained requestIdleCallback.
  const idle = window as Window & { requestIdleCallback?: Window["requestIdleCallback"] };
  if (typeof idle.requestIdleCallback === "function") {
    const id = idle.requestIdleCallback(callback, { timeout });
    return () => window.cancelIdleCallback(id);
  }
  const id = window.setTimeout(callback, 200);
  return () => window.clearTimeout(id);
}
