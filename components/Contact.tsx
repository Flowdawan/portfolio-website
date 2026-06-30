import { ArrowUpRight, KeyRound, Mail } from "lucide-react";
import { GitHubMark } from "./GitHubMark";
import { MagneticLink, Reveal } from "./MotionPrimitives";

export function Contact() {
  return (
    <section className="contact-section" id="contact">
      <div className="section-shell">
        <Reveal className="contact-topline">
          <div className="section-kicker"><span>04</span>Contact</div>
          <div className="contact-status"><i /> Open to interesting conversations</div>
        </Reveal>

        <Reveal className="contact-main" delay={0.06}>
          <p>Have a complex idea?</p>
          <h2>Let&apos;s make it<br /><span>feel inevitable.</span></h2>
          <p className="contact-copy">
            If you&apos;ve made it this far, grab another coffee or tea and tell me what you&apos;re thinking about.
          </p>
          <MagneticLink href="mailto:vc@deflow.at" className="contact-email">
            <Mail size={22} strokeWidth={1.7} />
            vc@deflow.at
            <ArrowUpRight size={24} strokeWidth={1.7} />
          </MagneticLink>
        </Reveal>

        <Reveal className="contact-links" delay={0.12}>
          <a href="https://github.com/Flowdawan" target="_blank" rel="noopener noreferrer">
            <span><GitHubMark width={19} height={19} />GitHub</span><ArrowUpRight size={18} />
          </a>
          <a href="/publickey_deflow.asc" download>
            <span><KeyRound size={19} />OpenPGP Public Key</span><ArrowUpRight size={18} />
          </a>
        </Reveal>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="site-footer section-shell">
      <a href="#home" className="footer-brand"><span>F</span> Florian.</a>
      <p>Software, AI & intelligent workflows.</p>
      <p>© {new Date().getFullYear()} · Built in Austria</p>
    </footer>
  );
}
