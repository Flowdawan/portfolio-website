"use client";

import { useEffect } from "react";
import { initAnchors } from "@/lib/effects/anchors";
import { initEasterEggs } from "@/lib/effects/easter";
import { initMarquee } from "@/lib/effects/marquee";
import { initPointerEffects } from "@/lib/effects/pointer";
import { initReveals } from "@/lib/effects/reveal";
import { initScenes } from "@/lib/effects/scenes";
import { whenIdle } from "@/lib/idle";
import { initScroll } from "@/lib/scroll";

// Wires up every progressive enhancement once after hydration. The sections
// themselves are server-rendered markup; this is the only place that attaches
// behaviour to them through data attributes. Only scrolling is set up right
// away — everything else is spread over idle time so hydration stays short.
export function Effects() {
  useEffect(() => {
    const cleanups = [initScroll(), initAnchors()];
    const cancelScenes = whenIdle(() => {
      cleanups.push(initReveals(), initScenes(), initMarquee(), initPointerEffects());
    }, 300);
    const cancelExtras = whenIdle(() => cleanups.push(initEasterEggs()), 3000);
    return () => {
      cancelScenes();
      cancelExtras();
      cleanups.forEach((cleanup) => cleanup());
    };
  }, []);

  return null;
}
