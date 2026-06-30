"use client";

import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  type HTMLMotionProps,
} from "framer-motion";
import { useEffect, useRef, type MouseEvent, type ReactNode } from "react";

export function Reveal({
  children,
  delay = 0,
  className,
  ...props
}: HTMLMotionProps<"div"> & { delay?: number }) {
  const reduced = useReducedMotion();

  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 28, filter: "blur(8px)" }}
      whileInView={reduced ? undefined : { opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, amount: 0.18 }}
      transition={{ duration: 0.7, delay, ease: [0.2, 0, 0, 1] }}
      className={["motion-reveal", className].filter(Boolean).join(" ")}
      {...props}
    >
      {children}
    </motion.div>
  );
}

type MagneticLinkProps = {
  href: string;
  children: ReactNode;
  className?: string;
  external?: boolean;
  ariaLabel?: string;
};

export function MagneticLink({
  href,
  children,
  className,
  external,
  ariaLabel,
}: MagneticLinkProps) {
  const reduced = useReducedMotion();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 240, damping: 18, mass: 0.25 });
  const springY = useSpring(y, { stiffness: 240, damping: 18, mass: 0.25 });

  function handleMove(event: MouseEvent<HTMLAnchorElement>) {
    if (reduced) return;
    const rect = event.currentTarget.getBoundingClientRect();
    x.set((event.clientX - rect.left - rect.width / 2) * 0.16);
    y.set((event.clientY - rect.top - rect.height / 2) * 0.16);
  }

  function reset() {
    x.set(0);
    y.set(0);
  }

  return (
    <motion.a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      aria-label={ariaLabel}
      onMouseMove={handleMove}
      onMouseLeave={reset}
      onBlur={reset}
      whileTap={reduced ? undefined : { scale: 0.96 }}
      style={{ x: springX, y: springY }}
      className={className}
    >
      {children}
    </motion.a>
  );
}

export function TiltCard({
  children,
  className,
  ...props
}: HTMLMotionProps<"article">) {
  const reduced = useReducedMotion();
  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const smoothX = useSpring(rotateX, { stiffness: 180, damping: 22 });
  const smoothY = useSpring(rotateY, { stiffness: 180, damping: 22 });

  function handleMove(event: MouseEvent<HTMLElement>) {
    if (reduced) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width;
    const py = (event.clientY - rect.top) / rect.height;
    rotateX.set((0.5 - py) * 5);
    rotateY.set((px - 0.5) * 5);
  }

  function reset() {
    rotateX.set(0);
    rotateY.set(0);
  }

  return (
    <motion.article
      onMouseMove={handleMove}
      onMouseLeave={reset}
      style={{ rotateX: smoothX, rotateY: smoothY, transformPerspective: 1100 }}
      className={className}
      {...props}
    >
      {children}
    </motion.article>
  );
}

export function CursorAura() {
  const auraRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return;
    const aura = auraRef.current;
    if (!aura) return;
    let frame = 0;
    let x = -200;
    let y = -200;

    const move = (event: PointerEvent) => {
      x = event.clientX;
      y = event.clientY;
      if (frame) return;
      frame = requestAnimationFrame(() => {
        aura.style.transform = `translate3d(${x - 180}px, ${y - 180}px, 0)`;
        frame = 0;
      });
    };

    window.addEventListener("pointermove", move, { passive: true });
    return () => {
      window.removeEventListener("pointermove", move);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return <div ref={auraRef} className="cursor-aura" aria-hidden="true" />;
}

export function PageBackground() {
  return (
    <div className="page-background" aria-hidden="true">
      <div className="background-orb background-orb-one" />
      <div className="background-orb background-orb-two" />
      <div className="background-grid" />
      <div className="noise-layer" />
    </div>
  );
}
