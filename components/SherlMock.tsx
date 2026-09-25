"use client";

import { Radio, Users } from "lucide-react";
import { useEffect, useRef, useState } from "react";

// A living mock of a Sherl round: the question cycles, an estimate gets typed,
// chips land in the pot and the other players lock in. Timers only run while
// the mock is on screen.

const rounds = [
  { question: "How many kilometres of coastline does Europe have?", estimate: "38,000", unit: "km" },
  { question: "How tall is the Eiffel Tower, antennas included?", estimate: "330", unit: "m" },
  { question: "How many bones are in an adult human body?", estimate: "206", unit: "bones" },
];

const players = [
  { initial: "M", name: "Mia", chips: 2 },
  { initial: "L", name: "Leo", chips: 1 },
  { initial: "S", name: "Sam", chips: 3 },
];

const ROUND_MS = 7200;

export function SherlMock() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [round, setRound] = useState(0);
  const [typed, setTyped] = useState(rounds[0].estimate);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    let timers: number[] = [];
    let current = 0;
    let running = false;

    const clear = () => {
      timers.forEach((timer) => window.clearTimeout(timer));
      timers = [];
    };

    const playRound = () => {
      const { estimate } = rounds[current];
      setRound(current);
      setTyped("");
      for (let i = 1; i <= estimate.length; i += 1) {
        timers.push(window.setTimeout(() => setTyped(estimate.slice(0, i)), 700 + i * 120));
      }
      timers.push(
        window.setTimeout(() => {
          current = (current + 1) % rounds.length;
          playRound();
        }, ROUND_MS),
      );
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !running) {
          running = true;
          root.dataset.playing = "true";
          playRound();
        } else if (!entry.isIntersecting && running) {
          running = false;
          root.dataset.playing = "false";
          clear();
        }
      },
      { threshold: 0.2 },
    );
    observer.observe(root);
    return () => {
      observer.disconnect();
      clear();
    };
  }, []);

  const { question, unit } = rounds[round];

  return (
    <div className="sherl" ref={rootRef} aria-hidden="true">
      <div className="sherl__float sherl__float--room">
        <Users size={13} /> Room K7Q2 · 4 players
      </div>
      <div className="sherl__float sherl__float--pot">
        <span className="sherl__chip" />
        <span className="sherl__chip" />
        <span className="sherl__chip" />
        Pot · 12 chips
      </div>

      <div className="sherl__phone">
        <div className="sherl__screen" key={round}>
          <div className="sherl__bar">
            <span className="sherl__brand">
              <span className="sherl__logo">≈</span> Sherl
            </span>
            <span className="sherl__live">
              <Radio size={11} /> LIVE
            </span>
          </div>

          <div className="sherl__round">
            <span>Round {round + 4} / 8</span>
            <svg viewBox="0 0 36 36" className="sherl__timer">
              <circle cx="18" cy="18" r="15" />
              <circle cx="18" cy="18" r="15" className="sherl__timer-fill" pathLength={100} />
            </svg>
          </div>

          <p className="sherl__question">{question}</p>

          <div className="sherl__input">
            <span>Your estimate</span>
            <strong>
              {typed || " "}
              <i className="sherl__caret" />
              <em>{unit}</em>
            </strong>
          </div>

          <div className="sherl__stake">
            <span>Stake</span>
            <div className="sherl__stake-chips">
              <b className="is-on">1</b>
              <b className="is-on">2</b>
              <b>3</b>
            </div>
          </div>

          <ul className="sherl__players">
            {players.map((player, index) => (
              <li key={player.name} style={{ animationDelay: `${3000 + index * 650}ms` }}>
                <span className="sherl__avatar">{player.initial}</span>
                <span className="sherl__name">{player.name}</span>
                <span className="sherl__locked">
                  {"●".repeat(player.chips)} locked
                </span>
              </li>
            ))}
          </ul>

          <div className="sherl__cta">Lock in estimate</div>
        </div>
      </div>
    </div>
  );
}
