"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { MagneticLink } from "./MotionPrimitives";

const links = [
  { label: "About", href: "#about" },
  { label: "Expertise", href: "#expertise" },
  { label: "Work", href: "#projects" },
];

export function Navbar({ ready }: { ready: boolean }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const reduced = useReducedMotion();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.header
      initial={{ opacity: 0, y: -12 }}
      animate={ready ? { opacity: 1, y: 0 } : { opacity: 0, y: -12 }}
      transition={{ duration: reduced ? 0 : 0.55, ease: [0.2, 0, 0, 1] }}
      className={`site-header ${scrolled || open ? "site-header-scrolled" : ""}`}
    >
      <nav className="nav-shell" aria-label="Primary navigation">
        <a href="#home" className="brand" aria-label="Florian — back to top">
          <span className="brand-mark">F</span>
          <span className="brand-copy">Florian<span className="brand-dot">.</span></span>
        </a>

        <div className="desktop-nav">
          {links.map((link) => (
            <a key={link.href} href={link.href} className="nav-link">
              {link.label}
            </a>
          ))}
        </div>

        <div className="nav-actions">
          <MagneticLink href="#contact" className="nav-cta">
            Let&apos;s talk <ArrowUpRight size={15} strokeWidth={1.8} />
          </MagneticLink>
          <button
            type="button"
            className="menu-button"
            aria-label={open ? "Close navigation" : "Open navigation"}
            aria-expanded={open}
            onClick={() => setOpen((current) => !current)}
          >
            <span className={open ? "menu-icon menu-icon-active" : "menu-icon"}>
              <X size={21} />
            </span>
            <span className={open ? "menu-icon menu-icon-hidden" : "menu-icon menu-icon-active"}>
              <Menu size={21} />
            </span>
          </button>
        </div>
      </nav>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            className="mobile-nav"
            initial={{ opacity: 0, y: -12, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -12, filter: "blur(4px)" }}
            transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
          >
            {links.map((link, index) => (
              <motion.a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.06 }}
              >
                <span>0{index + 1}</span>{link.label}
              </motion.a>
            ))}
            <a href="https://github.com/Flowdawan" target="_blank" rel="noopener noreferrer" onClick={() => setOpen(false)}>
              <span>04</span>GitHub <ArrowUpRight size={18} />
            </a>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
