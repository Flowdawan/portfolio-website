import type { CSSProperties } from "react";
import { skillGroups } from "@/data/portfolio";
import { SkillVisual } from "./SkillVisual";

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
            Software, intelligence, infrastructure and security treated as one connected craft.
          </p>
        </header>

        <div className="stack">
          {skillGroups.map((group, index) => (
            <article
              className={`stack-card stack-card--${group.visual}`}
              data-stack-card
              style={{ "--i": index } as CSSProperties}
              key={group.title}
            >
              <div className="stack-card__inner">
                <div className="stack-card__copy">
                  <div className="stack-card__top">
                    <span className="stack-card__index">{group.index}</span>
                    <span className="label">{group.skills.length} disciplines</span>
                  </div>
                  <h3>{group.title}</h3>
                  <p className="stack-card__desc">{group.description}</p>
                  <ul className="stack-card__skills" aria-label={`${group.title} skills`}>
                    {group.skills.map((skill) => (
                      <li key={skill}>{skill}</li>
                    ))}
                  </ul>
                </div>
                <div className="stack-card__visual" aria-hidden="true">
                  <SkillVisual kind={group.visual} />
                </div>
              </div>
              <span className="stack-card__shade" aria-hidden="true" />
            </article>
          ))}
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
