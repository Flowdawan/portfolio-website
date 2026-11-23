import { ArrowDown, ArrowUpRight } from "lucide-react";
import type { CSSProperties } from "react";
import { ForgeLine } from "./Forge";

const late = (order: number) => ({ "--late": order }) as CSSProperties;

export function Hero() {
  return (
    <section className="hero" id="home" aria-labelledby="hero-title">
      <div className="container hero__inner">
        <div className="hero__meta" data-late style={late(0)}>
          <p className="label hero__who">
            <span className="status-dot" aria-hidden="true" />
            Florian — Software &amp; AI Engineer
          </p>
          <p className="label">Based in Austria</p>
          <p className="label">47.52° N, 14.55° E</p>
          <p className="label hero__time">Portfolio — 2026</p>
        </div>

        <h1 className="hero__title" id="hero-title">
          <span className="sr-only">Building software that thinks ahead.</span>
          <ForgeLine className="hero__line" text="Building" />
          <ForgeLine className="hero__line" text="software that" />
          <span className="hero__line hero__line--last" aria-hidden="true">
            <ForgeLine text="thinks ahead" />
            <span className="hero__mark" data-late style={late(2)} />
          </span>
        </h1>

        <div className="hero__bottom">
          <p className="hero__index label" data-late style={late(1)}>
            (00) — Intro
          </p>
          <p className="hero__intro" data-late style={late(1)}>
            I design and engineer modern products, AI systems and intelligent workflows — from the first idea to
            secure production.
          </p>
          <div className="hero__actions" data-late style={late(2)}>
            <a href="#projects" className="button button--primary" data-magnetic>
              <span className="roll">
                <span>Selected work</span>
              </span>
              <ArrowUpRight size={18} strokeWidth={1.8} aria-hidden="true" />
            </a>
            <a href="#about" className="button button--ghost" data-magnetic>
              <span className="roll">
                <span>About me</span>
              </span>
              <ArrowDown size={17} strokeWidth={1.8} aria-hidden="true" />
            </a>
          </div>
        </div>

        <div className="hero__foot" data-late style={late(3)}>
          <p className="label">Available for select projects · 2026</p>
          <a href="#about" className="scroll-cue" aria-label="Scroll to the about section">
            Scroll <i aria-hidden="true" />
          </a>
        </div>
      </div>
    </section>
  );
}
