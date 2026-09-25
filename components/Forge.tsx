import { Fragment } from "react";

// Splits a line into per-letter spans the burn intro can heat individually.
// Words stay unbreakable; the readable text lives in a visually hidden copy.
export function ForgeLine({ text, className }: { text: string; className?: string }) {
  const words = text.split(" ");
  return (
    <span className={className} aria-hidden="true">
      {words.map((word, wordIndex) => (
        <Fragment key={`${word}-${wordIndex}`}>
          <span className="forge-word">
            {Array.from(word).map((char, charIndex) => (
              <span className="forge-ch" data-forge key={charIndex}>
                {char}
              </span>
            ))}
          </span>
          {wordIndex < words.length - 1 ? " " : null}
        </Fragment>
      ))}
    </span>
  );
}
