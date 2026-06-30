import { ArrowDownRight, Code2, MapPin, Network, Sparkles } from "lucide-react";
import { Reveal } from "./MotionPrimitives";

const timeline = [
  {
    icon: Code2,
    label: "Foundation",
    title: "Computer Science × Communication",
    text: "A background in Computer Science and Digital Communication shaped the way I balance technical depth with clarity and human context.",
  },
  {
    icon: Network,
    label: "Practice",
    title: "From native apps to full systems",
    text: "Android, web, APIs, infrastructure and delivery — understanding the whole system makes every individual decision better.",
  },
  {
    icon: Sparkles,
    label: "Now",
    title: "Engineering with intelligence",
    text: "Today I combine software engineering with LLMs, agents, RAG and automation to create products that can reason, adapt and scale.",
  },
];

export function About() {
  return (
    <section className="content-section section-shell" id="about">
      <Reveal className="section-heading">
        <div className="section-kicker"><span>01</span>About</div>
        <h2>Builder by nature.<br /><span>Engineer by practice.</span></h2>
      </Reveal>

      <div className="about-grid">
        <Reveal className="about-intro" delay={0.06}>
          <p className="about-lead">
            I&apos;m an Android and web developer from Austria who studied Computer Science and Digital Communication — now building at the intersection of software and AI.
          </p>
          <p>
            I care about systems that feel simple on the surface and remain thoughtful underneath: useful interactions, clean architecture, secure defaults and automation that earns its place.
          </p>
          <div className="about-location"><MapPin size={17} /> Based in Austria · building for the web</div>
        </Reveal>

        <div className="about-principles">
          <Reveal className="principle-card" delay={0.1}>
            <span>01 / Think</span>
            <strong>Start with the real problem.</strong>
            <p>Clarity before code. The best implementation begins with the right question.</p>
            <ArrowDownRight size={20} />
          </Reveal>
          <Reveal className="principle-card principle-card-accent" delay={0.18}>
            <span>02 / Build</span>
            <strong>Make complexity feel calm.</strong>
            <p>Strong systems can be sophisticated inside without asking users to carry that weight.</p>
            <ArrowDownRight size={20} />
          </Reveal>
        </div>
      </div>

      <div className="timeline" aria-label="Experience timeline">
        {timeline.map((step, index) => (
          <Reveal className="timeline-item" delay={index * 0.08} key={step.label}>
            <div className="timeline-rail"><span>0{index + 1}</span><i /></div>
            <div className="timeline-icon"><step.icon size={19} strokeWidth={1.7} /></div>
            <div>
              <p className="timeline-label">{step.label}</p>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
