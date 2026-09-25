import { ArrowUpRight, KeyRound } from "lucide-react";
import type { CSSProperties } from "react";
import { contact } from "@/data/portfolio";
import { CopyEmail } from "./CopyEmail";
import { ForgeLine } from "./Forge";
import { GitHubMark } from "./GitHubMark";
import { LocalTime } from "./LocalTime";
import { ReplayIntro } from "./ReplayIntro";

export function Contact() {
  return (
    <section className="section contact" id="contact" aria-labelledby="contact-title">
      <div className="contact__glow" aria-hidden="true" />
      <div className="container">
        <div className="contact__top">
          <p className="kicker" data-reveal>
            <span>04</span>Contact
          </p>
          <p className="label contact__status" data-reveal>
            <span className="status-dot" aria-hidden="true" /> Open to interesting conversations
          </p>
        </div>

        <p className="contact__pre" data-reveal>
          Have a complex idea?
        </p>
        {/* Arrives as cold ash, then catches fire letter by letter — the intro's forge, once more. */}
        <h2 className="contact__title" id="contact-title" data-reveal="lines" data-forge-scene>
          <span className="sr-only">Let&apos;s make it feel inevitable.</span>
          <span className="line">
            <ForgeLine text="Let's make it" />
          </span>
          <span className="line">
            <ForgeLine className="contact__accent" text="feel inevitable." />
          </span>
        </h2>

        <div className="contact__row">
          <p className="contact__copy" data-reveal>
            If you&apos;ve made it this far, grab another coffee or tea and tell me what you&apos;re thinking about.
          </p>
          <div className="contact__email" data-reveal>
            <a className="email-link" href={`mailto:${contact.email}`} data-magnetic data-cursor="Write">
              <span className="email-link__text">{contact.email}</span>
              <ArrowUpRight size={28} strokeWidth={1.6} aria-hidden="true" />
            </a>
            <CopyEmail email={contact.email} />
          </div>
        </div>

        <div className="contact__links" data-reveal>
          <a href={contact.github} target="_blank" rel="noopener noreferrer" className="contact-link">
            <span>
              <GitHubMark width={19} height={19} /> GitHub
            </span>
            <span className="contact-link__meta">@Flowdawan</span>
            <ArrowUpRight size={18} strokeWidth={1.8} aria-hidden="true" />
          </a>
          <a href={contact.publicKey} download className="contact-link">
            <span>
              <KeyRound size={19} strokeWidth={1.7} aria-hidden="true" /> OpenPGP public key
            </span>
            <span className="contact-link__meta">.asc download</span>
            <ArrowUpRight size={18} strokeWidth={1.8} aria-hidden="true" />
          </a>
        </div>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="footer">
      <div className="container footer__top">
        <a href="#home" className="brand" aria-label="Florian — back to top">
          <span className="brand__name">Florian</span>
          <span className="brand__dot" aria-hidden="true" />
        </a>
        <p className="footer__claim">Software, AI &amp; intelligent workflows.</p>
        <div className="footer__actions">
          <ReplayIntro />
          <a href="#home" className="link-arrow">
            Back to top <span aria-hidden="true">↑</span>
          </a>
        </div>
      </div>

      <div className="wordmark" data-wordmark aria-hidden="true">
        {Array.from("Florian").map((char, index) => (
          <span key={index} style={{ "--i": index } as CSSProperties}>
            {char}
          </span>
        ))}
      </div>

      <div className="container footer__bottom">
        <p>© {new Date().getFullYear()} Florian · Built in Austria</p>
        <p>
          Vienna <LocalTime />
        </p>
        <p>Set in Host Grotesk &amp; Instrument Serif</p>
      </div>
    </footer>
  );
}
