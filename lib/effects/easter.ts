import { intro } from "@/lib/intro";

// Small things for curious people: a note in the console, a warmer tab title
// while you are away, and typing "2001" anywhere brings the old site back.
export function initEasterEggs() {
  const art = [
    "            (  .      )",
    "        )           (              )",
    "              .  '   .   '  .  '  .",
    "     (    , )       (.   )  (   ',    )",
    "      .' ) ( . )    ,  ( ,     )   ( .",
    "   ). , ( .   (  ) ( , ')  .' (  ,    )",
    "  (_,) . ), ) _) _,')  (, ) '. )  ,. (' )",
  ].join("\n");
  console.log(`%c${art}`, "color:#ff6a2b;font-family:monospace;line-height:1.15");
  console.log(
    "%cHey, fellow builder 👋%c\nThis site burns its 2001 self down on every first visit — raw WebGL, no three.js.\nType 2001 anywhere to watch it again. Want to build something together? vc@deflow.at",
    "color:#f3ede4;font:600 14px/1.6 system-ui",
    "color:#b8afa3;font:13px/1.6 system-ui",
  );

  const originalTitle = document.title;
  const onVisibility = () => {
    document.title = document.hidden ? "Still glowing… 🔥" : originalTitle;
  };

  let typed = "";
  const onKey = (event: KeyboardEvent) => {
    const target = event.target as HTMLElement | null;
    if (target?.closest("input, textarea, [contenteditable='true']")) return;
    if (event.key.length !== 1) return;
    typed = (typed + event.key).slice(-4);
    if (typed === "2001" && intro.phase === "done") {
      typed = "";
      intro.replay();
    }
  };

  document.addEventListener("visibilitychange", onVisibility);
  window.addEventListener("keydown", onKey);
  return () => {
    document.removeEventListener("visibilitychange", onVisibility);
    window.removeEventListener("keydown", onKey);
    document.title = originalTitle;
  };
}
