"use client";

import { ArrowUpRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { contact } from "@/data/portfolio";
import { lockScroll, onScroll, unlockScroll } from "@/lib/scroll";
import { LocalTime } from "./LocalTime";

const links = [
  { id: "about", label: "About" },
  { id: "expertise", label: "Expertise" },
  { id: "projects", label: "Work" },
  { id: "contact", label: "Contact" },
];

export function Navbar() {
  const headerRef = useRef<HTMLElement>(null);
  const fuseRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState("");

  // Hide while reading down, return on the way up; drive the burning fuse.
  useEffect(() => {
    const header = headerRef.current;
    const fuse = fuseRef.current;
    if (!header || !fuse) return;
    let lastY = 0;
    let hidden = false;
    // Scrollable height is cached (and refreshed on resize) so the scroll
    // handler never forces a layout.
    let max = 1;
    const measure = () => {
      max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    };
    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(document.body);
    const off = onScroll((y) => {
      fuse.style.setProperty("--progress", Math.min(1, Math.max(0, y / max)).toFixed(4));
      header.dataset.scrolled = String(y > 24);
      const delta = y - lastY;
      if (Math.abs(delta) < 6) return;
      const shouldHide = delta > 0 && y > 180;
      if (shouldHide !== hidden) {
        hidden = shouldHide;
        header.dataset.hidden = String(hidden);
      }
      lastY = y;
    });
    return () => {
      off();
      resizeObserver.disconnect();
    };
  }, []);

  // The hero is observed too, so jumping back to the top clears the marker.
  useEffect(() => {
    const sections = ["home", ...links.map((link) => link.id)]
      .map((id) => document.getElementById(id))
      .filter((section): section is HTMLElement => Boolean(section));
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(entry.target.id);
        });
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!open) return;
    lockScroll();
    const firstLink = menuRef.current?.querySelector<HTMLElement>("a");
    const focusTimer = window.setTimeout(() => firstLink?.focus(), 80);
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        toggleRef.current?.focus();
      }
      if (event.key === "Tab" && menuRef.current) {
        const focusables = [toggleRef.current, ...menuRef.current.querySelectorAll<HTMLElement>("a")].filter(
          (el): el is HTMLElement => Boolean(el),
        );
        const index = focusables.indexOf(document.activeElement as HTMLElement);
        const next = event.shiftKey ? index - 1 : index + 1;
        if (next < 0 || next >= focusables.length) {
          event.preventDefault();
          focusables[(next + focusables.length) % focusables.length].focus();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(focusTimer);
      window.removeEventListener("keydown", onKey);
      unlockScroll();
    };
  }, [open]);

  return (
    <>
      <div className="fuse-progress" ref={fuseRef} aria-hidden="true">
        <span className="fuse-progress__burn" />
        <span className="fuse-progress__spark" />
      </div>

      <header className="nav" ref={headerRef} data-open={open}>
        <div className="container nav__bar">
          <a href="#home" className="brand" aria-label="Florian — back to top" onClick={() => setOpen(false)}>
            <span className="brand__name">Florian</span>
            <span className="brand__dot" aria-hidden="true" />
          </a>

          <nav className="nav__links" aria-label="Primary">
            {links.map((link) => (
              <a
                key={link.id}
                href={`#${link.id}`}
                className="nav__link"
                aria-current={active === link.id ? "location" : undefined}
              >
                <span className="roll">
                  <span>{link.label}</span>
                </span>
              </a>
            ))}
          </nav>

          <div className="nav__right">
            <span className="label nav__time">
              Vienna <LocalTime />
            </span>
            <a href="#contact" className="button button--small" data-magnetic>
              <span className="roll">
                <span>Let&apos;s talk</span>
              </span>
              <ArrowUpRight size={15} strokeWidth={1.8} aria-hidden="true" />
            </a>
            <button
              ref={toggleRef}
              type="button"
              className="nav__toggle"
              aria-expanded={open}
              aria-controls="site-menu"
              onClick={() => setOpen((current) => !current)}
            >
              <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
              <span className="nav__toggle-lines" aria-hidden="true">
                <i />
                <i />
              </span>
            </button>
          </div>
        </div>
      </header>

      <div className="menu" id="site-menu" ref={menuRef} data-open={open} inert={!open}>
        <nav aria-label="Menu">
          <ol className="menu__links">
            {links.map((link, index) => (
              <li key={link.id} style={{ transitionDelay: open ? `${120 + index * 60}ms` : "0ms" }}>
                <a href={`#${link.id}`} onClick={() => setOpen(false)}>
                  <span>0{index + 1}</span>
                  {link.label}
                </a>
              </li>
            ))}
          </ol>
        </nav>
        <div className="menu__foot">
          <a href={`mailto:${contact.email}`}>{contact.email}</a>
          <a href={contact.github} target="_blank" rel="noopener noreferrer">
            GitHub <ArrowUpRight size={14} aria-hidden="true" />
          </a>
          <span className="label">
            Vienna <LocalTime />
          </span>
        </div>
      </div>
    </>
  );
}
