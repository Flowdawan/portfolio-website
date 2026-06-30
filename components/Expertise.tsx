import { skillGroups } from "@/data/portfolio";
import { Reveal } from "./MotionPrimitives";

export function Expertise() {
  return (
    <section className="content-section expertise-section" id="expertise">
      <div className="section-shell">
        <Reveal className="section-heading expertise-heading">
          <div className="section-kicker"><span>02</span>Expertise</div>
          <h2>One stack.<br /><span>Many kinds of thinking.</span></h2>
          <p>Software, intelligence, infrastructure and security treated as one connected craft.</p>
        </Reveal>

        <div className="expertise-list">
          {skillGroups.map((group, index) => (
            <Reveal className={`expertise-row expertise-${group.accent}`} delay={index * 0.05} key={group.title}>
              <div className="expertise-meta">
                <span>{group.index}</span>
                <div>
                  <h3>{group.title}</h3>
                  <p>{group.description}</p>
                </div>
              </div>
              <div className="skill-cloud">
                {group.skills.map((skill) => <span key={skill}>{skill}</span>)}
              </div>
            </Reveal>
          ))}
        </div>
      </div>
      <div className="expertise-marquee" aria-hidden="true">
        <div>
          <span>DESIGN SYSTEMS</span><i />
          <span>AI WORKFLOWS</span><i />
          <span>SECURE SOFTWARE</span><i />
          <span>USEFUL AUTOMATION</span><i />
          <span>DESIGN SYSTEMS</span><i />
          <span>AI WORKFLOWS</span><i />
          <span>SECURE SOFTWARE</span><i />
          <span>USEFUL AUTOMATION</span><i />
        </div>
      </div>
    </section>
  );
}
