"use client";

import { Flame } from "lucide-react";
import { intro } from "@/lib/intro";

export function ReplayIntro() {
  return (
    <button type="button" className="replay" onClick={() => intro.replay()} data-cursor="Burn">
      <Flame size={15} strokeWidth={1.8} aria-hidden="true" />
      Relive 2001
    </button>
  );
}
