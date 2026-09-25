import { MapPin } from "lucide-react";
import type { CSSProperties } from "react";

const statement: Array<{ text: string; em?: boolean }> = [
  { text: "I'm an Android and web developer from Austria who studied Computer Science and Digital Communication — now building at the intersection of" },
  { text: "software and AI.", em: true },
  { text: "I care about systems that feel" },
  { text: "simple on the surface", em: true },
  { text: "and remain" },
  { text: "thoughtful underneath:", em: true },
  { text: "useful interactions, clean architecture, secure defaults and automation that earns its place." },
];

const principles = [
  {
    verb: "Think",
    title: "Start with the real problem.",
    text: "Clarity before code. The best implementation begins with the right question.",
  },
  {
    verb: "Build",
    title: "Make complexity feel calm.",
    text: "Strong systems can be sophisticated inside without asking users to carry that weight.",
  },
  {
    verb: "Ship",
    title: "Secure by default.",
    text: "Pipelines, sane defaults and automation that earns its place — so good ideas survive production.",
  },
];

const timeline = [
  {
    label: "Foundation",
    title: "Computer Science × Communication",
    text: "A background in Computer Science and Digital Communication shaped the way I balance technical depth with clarity and human context.",
  },
  {
    label: "Practice",
    title: "From native apps to full systems",
    text: "Android, web, APIs, infrastructure and delivery — understanding the whole system makes every individual decision better.",
  },
  {
    label: "Now",
    title: "Engineering with intelligence",
    text: "Today I combine software engineering with LLMs, agents, RAG and automation to create products that can reason, adapt and scale.",
  },
];

const vars = (values: Record<string, number>) => values as CSSProperties;

export function About() {
  let wordIndex = 0;
  const words = statement.flatMap((segment) =>
    segment.text.split(" ").map((word) => ({ word, em: segment.em, index: wordIndex++ })),
  );

  return (
    <section className="section about" id="about" aria-labelledby="about-title">
      <div className="container">
        <header className="section-head">
          <p className="kicker" data-reveal>
            <span>01</span>About
          </p>
          <h2 className="section-title" id="about-title" data-reveal="lines">
            <span className="line">
              <span>Builder by nature.</span>
            </span>
            <span className="line">
              <span>
                <em>Engineer by practice.</em>
              </span>
            </span>
          </h2>
        </header>

        <div className="about__statement">
          <p className="statement" data-scroll-lit style={vars({ "--n": words.length })}>
            {words.map(({ word, em, index }) => (
              <span key={index}>
                <span className={em ? "lit lit--em" : "lit"} style={vars({ "--i": index })}>
                  {word}
                </span>{" "}
              </span>
            ))}
          </p>
          <p className="label about__location" data-reveal>
            <MapPin size={15} aria-hidden="true" /> Based in Austria · building for the web
          </p>
        </div>

        <div className="principles">
          {principles.map((principle, index) => (
            <article
              className="principle"
              data-reveal
              data-spotlight
              style={vars({ "--delay": index })}
              key={principle.verb}
            >
              <p className="principle__index">
                0{index + 1} <span>/</span> {principle.verb}
              </p>
              <h3>{principle.title}</h3>
              <p className="principle__text">{principle.text}</p>
              <span className="principle__glow" aria-hidden="true" />
            </article>
          ))}
        </div>

        <div className="journey">
          <p className="kicker kicker--quiet" data-reveal>
            The path so far
          </p>
          <div className="fuse" data-fuse>
            <div className="fuse__track" aria-hidden="true">
              <span className="fuse__burn" />
              <span className="fuse__spark" />
            </div>
            <ol className="fuse__list">
              {timeline.map((step, index) => (
                <li className="fuse__item" data-fuse-item key={step.label}>
                  <span className="fuse__node" aria-hidden="true" />
                  <p className="fuse__label">
                    <span>0{index + 1}</span> {step.label}
                  </p>
                  <h3>{step.title}</h3>
                  <p className="fuse__text">{step.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}
