import type { CSSProperties } from "react";
import { skillGroups } from "@/data/portfolio";
import { SkillVisual } from "./SkillVisual";
import { SwarmCanvas } from "./swarm/SwarmCanvas";

const marqueeWords = ["Design systems", "AI workflows", "Secure software", "Useful automation", "Calm complexity"];

export function Expertise() {
  return (
    <section className="section expertise" id="expertise" aria-labelledby="expertise-title">
      <div className="container">
        <header className="section-head section-head--split">
          <div>
            <p className="kicker" data-reveal>
              <span>02</span>Expertise
            </p>
            <h2 className="section-title" id="expertise-title" data-reveal="lines">
              <span className="line">
                <span>One stack.</span>
              </span>
              <span className="line">
                <span>
                  <em>Many kinds of thinking.</em>
                </span>
              </span>
            </h2>
          </div>
          <p className="section-lede" data-reveal>
            Software, intelligence, infrastructure and security treated as one connected craft — the same embers,
            forged into a different shape for every job.
          </p>
        </header>
      </div>

      {/* Pinned on capable devices (html.swarm-ok): 18,000 embers re-forge into
          one form per discipline while the copy changes beside them. Elsewhere a
          plain list with a line drawing per discipline. */}
      <div className="swarm" data-swarm style={{ "--stages": skillGroups.length } as CSSProperties}>
        <div className="swarm__pin">
          <SwarmCanvas />
          <div className="container swarm__layout">
            <ol className="swarm__stages">
              {skillGroups.map((group, index) => (
                <li
                  className="swarm-stage"
                  data-swarm-stage
                  data-active={index === 0 ? "" : undefined}
                  style={{ "--i": index } as CSSProperties}
                  key={group.title}
                >
                  <div className="swarm-stage__top">
                    <span className="swarm-stage__index">{group.index}</span>
                    <span className="label">{group.skills.length} disciplines</span>
                  </div>
                  <h3>{group.title}</h3>
                  <p className="swarm-stage__desc">{group.description}</p>
                  <ul className="swarm-stage__skills" aria-label={`${group.title} skills`}>
                    {group.skills.map((skill, skillIndex) => (
                      <li key={skill} style={{ "--k": skillIndex } as CSSProperties}>
                        {skill}
                      </li>
                    ))}
                  </ul>
                  <p className="swarm-stage__figure label" aria-hidden="true">
                    Fig. {group.index} — {group.figure}
                  </p>
                  <div className="swarm-stage__viz" aria-hidden="true">
                    <SkillVisual kind={group.visual} />
                  </div>
                </li>
              ))}
            </ol>

            <div className="swarm__rail" aria-hidden="true">
              {skillGroups.map((group) => (
                <span className="swarm__tick" data-swarm-tick key={group.index}>
                  <b>{group.index}</b>
                  {group.title}
                </span>
              ))}
              <i className="swarm__fuse" />
            </div>
          </div>
        </div>
      </div>

      <div className="marquee" data-marquee aria-hidden="true">
        <div className="marquee__track">
          {[0, 1].map((copy) => (
            <div className="marquee__group" key={copy}>
              {marqueeWords.map((word) => (
                <span className="marquee__item" key={`${copy}-${word}`}>
                  <em>{word}</em>
                  <i />
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
