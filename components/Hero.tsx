import { ArrowDown, ArrowUpRight } from "lucide-react";
import type { CSSProperties } from "react";
import { ForgeLine } from "./Forge";
import { LocalTime } from "./LocalTime";

const late = (order: number) => ({ "--late": order }) as CSSProperties;

export function Hero() {
  return (
    <section className="hero" id="home" aria-labelledby="hero-title">
      <div className="hero__glow" aria-hidden="true" />
      <div className="container hero__inner">
        <div className="hero__meta" data-late style={late(0)}>
          <p className="label">
            <span className="status-dot" aria-hidden="true" />
            Florian — Software &amp; AI Engineer
          </p>
          <p className="label hero__meta-right">Based in Austria · 47.52° N, 14.55° E</p>
        </div>

        <h1 className="hero__title" id="hero-title">
          <span className="sr-only">Building software that thinks ahead.</span>
          <ForgeLine className="hero__line" text="Building software" />
          <ForgeLine className="hero__line hero__line--accent" text="that thinks ahead." />
        </h1>

        <div className="hero__bottom">
          <p className="hero__intro" data-late style={late(1)}>
            I design and engineer modern products, AI systems and intelligent workflows — from the first idea to secure
            production.
          </p>
          <div className="hero__actions" data-late style={late(2)}>
            <a href="#projects" className="button button--primary" data-magnetic>
              <span className="roll">
                <span>Explore selected work</span>
              </span>
              <ArrowUpRight size={18} strokeWidth={1.8} aria-hidden="true" />
            </a>
            <a href="#about" className="button button--ghost" data-magnetic>
              <span className="roll">
                <span>More about me</span>
              </span>
              <ArrowDown size={17} strokeWidth={1.8} aria-hidden="true" />
            </a>
          </div>
        </div>
      </div>

      <div className="container hero__foot" data-late style={late(3)}>
        <p className="label">Available for select projects · 2026</p>
        <a href="#about" className="scroll-cue" aria-label="Scroll to the about section">
          <span>Scroll</span>
          <i aria-hidden="true" />
        </a>
        <p className="label hero__foot-right">
          Vienna <LocalTime />
        </p>
      </div>
    </section>
  );
}
