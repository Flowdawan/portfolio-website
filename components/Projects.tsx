import Image from "next/image";
import { ArrowUpRight, Play, Radio, Users } from "lucide-react";
import { projects, type Project } from "@/data/portfolio";
import { GitHubMark } from "./GitHubMark";
import { Reveal, TiltCard } from "./MotionPrimitives";

function ProjectActions({ project }: { project: Project }) {
  return (
    <div className="project-actions">
      {project.live && (
        <a href={project.live} target="_blank" rel="noopener noreferrer">
          {project.actionLabel ?? "Live demo"}<ArrowUpRight size={16} />
        </a>
      )}
      {project.github && (
        <a href={project.github} target="_blank" rel="noopener noreferrer">
          <GitHubMark width={16} height={16} />Source
        </a>
      )}
    </div>
  );
}

function SherlPreview() {
  return (
    <div className="sherl-preview" aria-hidden="true">
      <div className="sherl-window-bar">
        <span /><span /><span />
        <p>sherl.at</p>
        <i>LIVE</i>
      </div>
      <div className="sherl-stage">
        <div className="sherl-brand">
          <span className="sherl-mark" aria-hidden="true">≈</span>
          <div><strong>Sherl</strong><p>ESTIMATE · BET · WIN THE POT</p></div>
        </div>
        <div className="sherl-question">
          <div><span>ROUND 04</span><span><Radio size={12} /> LIVE</span></div>
          <p>How many kilometres of coastline does Europe have?</p>
          <div className="sherl-answer"><span>Your estimate</span><strong>38,000 km</strong></div>
        </div>
        <div className="sherl-players">
          <div><Users size={14} /><span>4 players connected</span></div>
          <div className="player-stack"><i>F</i><i>M</i><i>L</i><i>+1</i></div>
        </div>
        <div className="sherl-fake-button">PLACE YOUR BET <Play size={14} fill="currentColor" /></div>
      </div>
      <div className="sherl-glow" />
    </div>
  );
}

function ProjectCard({ project, index }: { project: Project; index: number }) {
  return (
    <Reveal delay={(index % 2) * 0.08}>
      <TiltCard className="project-card">
        <div className="project-image-shell">
          {project.image ? (
            <Image
              src={project.image}
              alt={`${project.title} project preview`}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          ) : (
            <div
              className="project-poster"
              style={project.poster ? { background: project.poster } : undefined}
              aria-hidden="true"
            >
              <span className="project-poster-eyebrow">{project.eyebrow}</span>
              <span className="project-poster-title">{project.title}</span>
            </div>
          )}
          <a
            href={project.live ?? project.github}
            target="_blank"
            rel="noopener noreferrer"
            className="project-image-link"
            aria-label={`Open ${project.title}`}
          >
            <ArrowUpRight size={22} />
          </a>
          <span className="project-number">0{index + 2}</span>
        </div>
        <div className="project-card-copy">
          <p className="project-eyebrow">{project.eyebrow}</p>
          <h3>{project.title}</h3>
          <p className="project-description">{project.description}</p>
          <div className="project-tags">
            {project.tags.map((tag) => <span key={tag}>{tag}</span>)}
          </div>
          <ProjectActions project={project} />
        </div>
      </TiltCard>
    </Reveal>
  );
}

export function Projects() {
  const [featured, ...rest] = projects;

  return (
    <section className="content-section section-shell projects-section" id="projects">
      <Reveal className="section-heading projects-heading">
        <div className="section-kicker"><span>03</span>Selected work</div>
        <h2>Built to be used.<br /><span>Made to be remembered.</span></h2>
        <p>A selection of products, experiments and systems — from native Android to multiplayer web apps.</p>
      </Reveal>

      <Reveal className="featured-wrap" delay={0.08}>
        <TiltCard className="featured-project">
          <div className="featured-visual"><SherlPreview /></div>
          <div className="featured-copy">
            <div className="featured-index"><span>01</span><i />FEATURED</div>
            <p className="project-eyebrow">{featured.eyebrow}</p>
            <h3>{featured.title}</h3>
            <p className="project-description">{featured.description}</p>
            <div className="project-tags">
              {featured.tags.map((tag) => <span key={tag}>{tag}</span>)}
            </div>
            <ProjectActions project={featured} />
          </div>
        </TiltCard>
      </Reveal>

      <div className="projects-grid">
        {rest.map((project, index) => <ProjectCard project={project} index={index} key={project.title} />)}
      </div>

      <Reveal className="all-work-link">
        <p>More experiments live in the lab.</p>
        <a href="https://github.com/Flowdawan?tab=repositories" target="_blank" rel="noopener noreferrer">
          View all GitHub repositories <ArrowUpRight size={17} />
        </a>
      </Reveal>
    </section>
  );
}
