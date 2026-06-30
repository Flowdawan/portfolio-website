"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowDown, ArrowUpRight, Braces, Cpu, Sparkles, Workflow } from "lucide-react";
import { MagneticLink } from "./MotionPrimitives";

const item = {
  hidden: { opacity: 0, y: 22, filter: "blur(7px)" },
  visible: { opacity: 1, y: 0, filter: "blur(0px)" },
};

export function Hero({ ready }: { ready: boolean }) {
  const reduced = useReducedMotion();

  return (
    <section className="hero section-shell" id="home">
      <motion.div
        className="hero-copy"
        initial="hidden"
        animate={ready ? "visible" : "hidden"}
        variants={{
          visible: { transition: { staggerChildren: reduced ? 0 : 0.1 } },
        }}
      >
        <motion.div variants={item} transition={{ duration: reduced ? 0 : 0.6 }} className="availability-pill">
          <span className="availability-dot" />
          Software & AI Engineer · Austria
        </motion.div>
        <motion.p variants={item} transition={{ duration: reduced ? 0 : 0.65 }} className="hero-name">
          Florian
        </motion.p>
        <motion.h1 variants={item} transition={{ duration: reduced ? 0 : 0.7 }}>
          Building software
          <span>that thinks ahead.</span>
        </motion.h1>
        <motion.p variants={item} transition={{ duration: reduced ? 0 : 0.7 }} className="hero-intro">
          I design and engineer modern products, AI systems and intelligent workflows — from the first idea to secure production.
        </motion.p>
        <motion.div variants={item} transition={{ duration: reduced ? 0 : 0.7 }} className="hero-actions">
          <MagneticLink href="#projects" className="primary-button">
            Explore selected work <ArrowUpRight size={18} strokeWidth={1.8} />
          </MagneticLink>
          <MagneticLink href="#about" className="text-button">
            More about me <ArrowDown size={17} strokeWidth={1.8} />
          </MagneticLink>
        </motion.div>
      </motion.div>

      <motion.div
        className="hero-system"
        initial={{ opacity: 0, scale: 0.94, filter: "blur(12px)" }}
        animate={ready ? { opacity: 1, scale: 1, filter: "blur(0px)" } : undefined}
        transition={{ duration: reduced ? 0 : 0.9, delay: reduced ? 0 : 0.28, ease: [0.2, 0, 0, 1] }}
        aria-label="Visual map connecting AI, APIs, RAG and automation"
      >
        <div className="system-halo" />
        <div className="system-ring system-ring-outer" />
        <div className="system-ring system-ring-inner" />
        <div className="system-axis system-axis-x" />
        <div className="system-axis system-axis-y" />

        <div className="system-core">
          <Sparkles size={20} />
          <strong>AI</strong>
          <span>orchestration</span>
        </div>
        <div className="orbit-node orbit-node-one"><Cpu size={16} /><span>LLM</span></div>
        <div className="orbit-node orbit-node-two"><Braces size={16} /><span>API</span></div>
        <div className="orbit-node orbit-node-three"><Workflow size={16} /><span>RAG</span></div>
        <div className="orbit-node orbit-node-four"><Sparkles size={16} /><span>MCP</span></div>

        <div className="system-status">
          <div><span>SYS / 04</span><span className="status-online">live</span></div>
          <p>Intelligence layer</p>
          <div className="status-wave" aria-hidden="true">
            {Array.from({ length: 15 }).map((_, index) => <i key={index} />)}
          </div>
        </div>
        <div className="system-coordinate system-coordinate-left">47.5162° N</div>
        <div className="system-coordinate system-coordinate-right">14.5501° E</div>
      </motion.div>

      <motion.a
        href="#about"
        className="scroll-cue"
        initial={{ opacity: 0 }}
        animate={ready ? { opacity: 1 } : undefined}
        transition={{ delay: reduced ? 0 : 0.9 }}
        aria-label="Scroll to about section"
      >
        <span>Scroll to explore</span><i />
      </motion.a>
    </section>
  );
}
