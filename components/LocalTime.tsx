"use client";

import { useSyncExternalStore } from "react";

// Live Vienna time. Rendered as "--:--" on the server and hydrated on the client
// without a mismatch, then ticks once a minute.

// Created lazily: loading time-zone data is surprisingly expensive, so it
// happens after hydration instead of while the module is evaluated.
let format: Intl.DateTimeFormat | null = null;
let current = "--:--";
const listeners = new Set<() => void>();
let timer = 0;

function tick() {
  format ??= new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Vienna", hour: "2-digit", minute: "2-digit" });
  current = format.format(new Date());
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (listeners.size === 1) {
    timer = window.setTimeout(() => {
      tick();
      const msToNextMinute = 60_000 - (Date.now() % 60_000);
      timer = window.setTimeout(function next() {
        tick();
        timer = window.setTimeout(next, 60_000);
      }, msToNextMinute + 50);
    }, 1500);
  }
  return () => {
    listeners.delete(listener);
    if (!listeners.size) window.clearTimeout(timer);
  };
}

export function LocalTime() {
  const time = useSyncExternalStore(
    subscribe,
    () => current,
    () => "--:--",
  );
  return (
    <time className="local-time" suppressHydrationWarning>
      {time}
    </time>
  );
}
