import { ArrowUpRight } from "lucide-react";
import type { CSSProperties } from "react";
import { contact, projects } from "@/data/portfolio";
import { GitHubMark } from "./GitHubMark";
import { LivePreview } from "./LivePreview";
import { SherlMock } from "./SherlMock";

export function Projects() {
  const featured = projects.find((project) => project.featured) ?? projects[0];
  const lab = projects.filter((project) => project !== featured);

  return (
    <section className="section work" id="projects" aria-labelledby="work-title">
      <div className="container">
        <header className="section-head section-head--split">
          <div>
            <p className="kicker" data-reveal>
              <span>03</span>Selected work
            </p>
            <h2 className="section-title" id="work-title" data-reveal="lines">
              <span className="line">
                <span>Built to be used.</span>
              </span>
              <span className="line">
                <span>
                  <em>Made to be remembered.</em>
                </span>
              </span>
            </h2>
          </div>
          <p className="section-lede" data-reveal>
            Products and experiments — from a multiplayer party game to playable explainers. Every preview below is
            running live: move your cursor over it.
          </p>
        </header>

        <article className="feature" data-reveal data-tilt>
          <div className="feature__visual">
            <SherlMock />
          </div>
          <div className="feature__copy">
            <p className="feature__index">
              <span>01</span>
              <i aria-hidden="true" />
              Featured
            </p>
            <p className="eyebrow">{featured.eyebrow}</p>
            <h3>{featured.title}</h3>
            <p className="feature__desc">{featured.description}</p>
            <ul className="tags" aria-label="Tags">
              {featured.tags.map((tag) => (
                <li key={tag}>{tag}</li>
              ))}
            </ul>
            {featured.live && (
              <a className="button button--primary" href={featured.live} target="_blank" rel="noopener noreferrer" data-magnetic>
                <span className="roll">
                  <span>{featured.actionLabel}</span>
                </span>
                <ArrowUpRight size={18} strokeWidth={1.8} aria-hidden="true" />
              </a>
            )}
          </div>
        </article>

        <div className="lab">
          {lab.map((project, index) => (
            <article
              className="lab-card"
              data-reveal
              data-preview-host
              data-spotlight
              data-cursor="Open"
              style={{ "--delay": index % 2 } as CSSProperties}
              key={project.title}
            >
              <div className="lab-card__preview">
                {project.preview && <LivePreview kind={project.preview} />}
                <span className="lab-card__number">0{index + 2}</span>
                {project.previewHint && <span className="lab-card__hint">{project.previewHint}</span>}
                <span className="lab-card__open" aria-hidden="true">
                  <ArrowUpRight size={20} strokeWidth={1.8} />
                </span>
              </div>
              <div className="lab-card__body">
                <p className="eyebrow">{project.eyebrow}</p>
                <h3>
                  <a className="lab-card__link" href={project.live ?? project.github} target="_blank" rel="noopener noreferrer">
                    {project.title}
                  </a>
                </h3>
                <p className="lab-card__desc">{project.description}</p>
                <ul className="tags" aria-label="Tags">
                  {project.tags.map((tag) => (
                    <li key={tag}>{tag}</li>
                  ))}
                </ul>
                <span className="lab-card__cta" aria-hidden="true">
                  {project.actionLabel ?? "Open"} <ArrowUpRight size={15} strokeWidth={1.8} />
                </span>
              </div>
            </article>
          ))}
        </div>

        <div className="work__more" data-reveal>
          <p>More experiments live in the lab.</p>
          <a href={contact.repositories} target="_blank" rel="noopener noreferrer" className="link-arrow">
            <GitHubMark width={17} height={17} />
            View all GitHub repositories
            <ArrowUpRight size={16} strokeWidth={1.8} aria-hidden="true" />
          </a>
        </div>
      </div>
    </section>
  );
}
