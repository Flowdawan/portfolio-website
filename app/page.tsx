import { About } from "@/components/About";
import { Contact, Footer } from "@/components/Contact";
import { Cursor } from "@/components/Cursor";
import { Effects } from "@/components/Effects";
import { EmberField } from "@/components/EmberField";
import { Expertise } from "@/components/Expertise";
import { Hero } from "@/components/Hero";
import { BurnIntro } from "@/components/intro/BurnIntro";
import { Navbar } from "@/components/Navbar";
import { Projects } from "@/components/Projects";

export default function Home() {
  return (
    <>
      <BurnIntro />
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <EmberField />
      <Navbar />
      <main id="main-content">
        <Hero />
        <About />
        <Expertise />
        <Projects />
        <Contact />
      </main>
      <Footer />
      <Cursor />
      <Effects />
    </>
  );
}
