"use client";

import { AnimatePresence, animate, motion, useMotionValue, useReducedMotion, useTransform } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  rot: number;
  vrot: number;
  kind: "ember" | "ash" | "smoke";
};

// Vorgerenderte Glow-Sprites: ein einmal gezeichneter radialer Verlauf, der pro Frame
// nur noch via drawImage kopiert wird. Ersetzt das frühere context.shadowBlur (pro Partikel,
// pro Frame) — die mit Abstand teuerste Canvas-Operation und Hauptursache des Ruckelns.
function makeSprite(size: number, stops: Array<[number, string]>) {
  const sprite = document.createElement("canvas");
  sprite.width = size;
  sprite.height = size;
  const ctx = sprite.getContext("2d");
  if (ctx) {
    const r = size / 2;
    const gradient = ctx.createRadialGradient(r, r, 0, r, r, r);
    for (const [offset, color] of stops) gradient.addColorStop(offset, color);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
  }
  return sprite;
}

function BurnParticles({ progress }: { progress: ReturnType<typeof useMotionValue<number>> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    const lowPower = window.matchMedia("(max-width: 720px), (pointer: coarse)").matches;
    const frameInterval = lowPower ? 1000 / 32 : 0;
    const particleLimit = lowPower ? 70 : 240;
    const emitPerFrame = lowPower ? 2 : 6;
    let width = window.innerWidth;
    let height = window.innerHeight;
    let frame = 0;
    let last = performance.now();
    const particles: Particle[] = [];

    const emberSprite = makeSprite(36, [
      [0, "rgba(255,236,180,1)"],
      [0.35, "rgba(255,150,45,0.95)"],
      [0.7, "rgba(255,92,20,0.45)"],
      [1, "rgba(255,80,18,0)"],
    ]);
    const smokeSprite = makeSprite(96, [
      [0, "rgba(46,43,41,0.55)"],
      [0.6, "rgba(40,38,37,0.22)"],
      [1, "rgba(38,36,35,0)"],
    ]);

    const resize = () => {
      const dpr = lowPower ? 1 : Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const addParticle = (edgeY: number) => {
      const roll = Math.random();
      const kind: Particle["kind"] = lowPower
        ? (roll > 0.5 ? "ash" : "ember")
        : (roll > 0.7 ? "smoke" : roll > 0.32 ? "ash" : "ember");
      const maxLife = kind === "smoke" ? 120 : 60 + Math.random() * 55;
      particles.push({
        x: Math.random() * width,
        y: edgeY + (Math.random() - 0.5) * 26,
        vx: (Math.random() - 0.5) * (kind === "smoke" ? 0.5 : 1.8),
        vy: kind === "ash" ? 0.25 + Math.random() * 0.7 : -(0.5 + Math.random() * 2),
        life: maxLife,
        maxLife,
        size: kind === "smoke" ? 26 + Math.random() * 46 : kind === "ash" ? 1.4 + Math.random() * 1.8 : 4 + Math.random() * 7,
        rot: Math.random() * Math.PI,
        vrot: (Math.random() - 0.5) * 0.04,
        kind,
      });
    };

    const draw = (now: number) => {
      if (now - last < frameInterval || document.visibilityState !== "visible") {
        if (document.visibilityState !== "visible") last = now;
        frame = requestAnimationFrame(draw);
        return;
      }

      const delta = Math.min((now - last) / 16.67, 2);
      last = now;
      context.clearRect(0, 0, width, height);
      const value = progress.get();
      const edgeY = height * (1 - value / 100);

      if (value > 0.5 && value < 99.5 && particles.length < particleLimit) {
        for (let i = 0; i < emitPerFrame; i += 1) addParticle(edgeY);
      }

      // Erst Asche + Rauch (normales Blending), dann Glut additiv darüber — so muss
      // globalCompositeOperation nur zweimal pro Frame gewechselt werden statt pro Partikel.
      context.globalCompositeOperation = "source-over";
      for (let index = particles.length - 1; index >= 0; index -= 1) {
        const particle = particles[index];
        particle.life -= delta;
        if (particle.life <= 0) {
          particles.splice(index, 1);
          continue;
        }

        particle.x += particle.vx * delta;
        particle.y += particle.vy * delta;
        particle.rot += particle.vrot * delta;
        if (particle.kind === "ash") particle.vy += 0.012 * delta;
        if (particle.kind === "smoke") {
          particle.size += 0.16 * delta;
          particle.vx += Math.sin(particle.life * 0.08) * 0.01;
        }
        if (particle.kind === "ember") continue; // im additiven Durchgang gezeichnet

        const opacity = Math.min(1, particle.life / (particle.maxLife * 0.35));
        if (particle.kind === "smoke") {
          const d = particle.size * 2;
          context.globalAlpha = opacity * 0.5;
          context.drawImage(smokeSprite, particle.x - particle.size, particle.y - particle.size, d, d);
        } else {
          context.globalAlpha = opacity * 0.75;
          context.fillStyle = "#6f6862";
          context.beginPath();
          context.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
          context.fill();
        }
      }

      context.globalCompositeOperation = "lighter";
      for (let index = 0; index < particles.length; index += 1) {
        const particle = particles[index];
        if (particle.kind !== "ember") continue;
        const opacity = Math.min(1, particle.life / (particle.maxLife * 0.4));
        const d = particle.size * 2;
        context.globalAlpha = opacity;
        context.drawImage(emberSprite, particle.x - particle.size, particle.y - particle.size, d, d);
      }

      context.globalAlpha = 1;
      context.globalCompositeOperation = "source-over";
      frame = requestAnimationFrame(draw);
    };

    resize();
    window.addEventListener("resize", resize);
    frame = requestAnimationFrame(draw);
    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(frame);
    };
  }, [progress]);

  return <canvas className="burn-particles" ref={canvasRef} aria-hidden="true" />;
}

function OldPortfolio() {
  return (
    <div className="old-site">
      <div className="old-stars" aria-hidden="true" />
      <header className="old-header">
        <div className="old-logo">★ FLORIAN&apos;S HOMEPAGE ★</div>
        <div className="old-marquee">
          <span>WELCOME TO MY AWESOME PORTFOLIO!!! &nbsp; BEST VIEWED IN NETSCAPE &nbsp; ★★★</span>
        </div>
      </header>
      <main className="old-layout">
        <aside className="old-sidebar">
          <p className="old-menu-title">~ MENU ~</p>
          <a href="#about">HOME</a>
          <a href="#about">ABOUT ME</a>
          <a href="#projects">MY PROJECTZ</a>
          <a href="#contact">GUESTBOOK</a>
          <div className="old-counter">VISITOR<br /><strong>000042</strong></div>
        </aside>
        <div className="old-content">
          <p className="old-blink">UNDER CONSTRUCTION!</p>
          <div className="old-construction">🚧 &nbsp; 🚧 &nbsp; 🚧</div>
          <h1>Hi!!! I&apos;m Florian!!!</h1>
          <p className="old-rainbow">Web Developer • Programmer • AI Engineer</p>
          <div className="old-rule" />
          <p>
            I make <b>SUPER COOL</b>{" "}Android apps and websites!! Click around and don&apos;t forget to sign my guestbook :)
          </p>
          <table className="old-table">
            <tbody>
              <tr><td>My Skills</td><td>HTML, React, Java, Python</td></tr>
              <tr><td>Status</td><td className="old-online">● ONLINE</td></tr>
              <tr><td>E-Mail</td><td>vc@deflow.at</td></tr>
            </tbody>
          </table>
          <button type="button" className="old-button">CLICK HERE!!!</button>
        </div>
      </main>
      <footer className="old-footer">© 2001 FLORIAN • MADE WITH MICROSOFT FRONTPAGE • NO COOKIES!!!</footer>
    </div>
  );
}

export function BurnIntro({ onComplete }: { onComplete: () => void }) {
  const reduced = useReducedMotion();
  const [visible, setVisible] = useState(true);
  const progress = useMotionValue(0);
  const clipPath = useTransform(progress, (value) => `inset(0 0 ${value}% 0)`);
  const edgeY = useTransform(progress, [0, 100], ["0vh", "-110vh"]);

  const finish = useCallback(() => {
    progress.set(100);
    setVisible(false);
    document.body.classList.remove("intro-active");
    onComplete();
  }, [onComplete, progress]);

  useEffect(() => {
    if (reduced) {
      const timer = window.setTimeout(finish, 80);
      return () => window.clearTimeout(timer);
    }

    document.body.classList.add("intro-active");
    // Kürzer + ruhiger: ~1.15s Vorlauf (Retro-Gag lesbar), dann 2.0s Burn statt vorher
    // 3.05s + 2.8s. Sanftes ease-in-out ohne harten Stopp am Ende.
    const controls = animate(progress, 100, {
      delay: 1.15,
      duration: 2,
      ease: [0.4, 0, 0.2, 1],
      onComplete: () => window.setTimeout(finish, 120),
    });
    return () => {
      controls.stop();
      document.body.classList.remove("intro-active");
    };
  }, [finish, progress, reduced]);

  return (
    <AnimatePresence initial={false}>
      {visible && (
        <motion.div
          className="intro-shell"
          exit={{ opacity: 0, filter: "blur(4px)", y: -12 }}
          transition={{ duration: 0.18, ease: "easeIn" }}
        >
          <motion.div className="burn-sheet" style={{ clipPath }}>
            <OldPortfolio />
          </motion.div>
          <motion.div className="burn-edge" style={{ y: edgeY }} aria-hidden="true">
            <div className="burn-edge-smoke" />
            <div className="burn-edge-char" />
            <div className="burn-edge-core" />
          </motion.div>
          <BurnParticles progress={progress} />
          <button type="button" className="skip-intro" onClick={finish}>
            Skip intro <span aria-hidden="true">↗</span>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
