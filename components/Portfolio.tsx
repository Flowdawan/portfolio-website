"use client";

import { useCallback, useState } from "react";
import { About } from "./About";
import { BurnIntro } from "./BurnIntro";
import { Contact, Footer } from "./Contact";
import { Expertise } from "./Expertise";
import { Hero } from "./Hero";
import { CursorAura, PageBackground } from "./MotionPrimitives";
import { Navbar } from "./Navbar";
import { Projects } from "./Projects";

export function Portfolio() {
  const [ready, setReady] = useState(false);
  const completeIntro = useCallback(() => setReady(true), []);

  return (
    <>
      <a className="skip-link" href="#main-content">Skip to content</a>
      <PageBackground />
      <CursorAura />
      <BurnIntro onComplete={completeIntro} />
      <Navbar ready={ready} />
      <main id="main-content">
        <Hero ready={ready} />
        <About />
        <Expertise />
        <Projects />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
