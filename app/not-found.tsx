import type { Metadata } from "next";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Page not found — Florian",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <main className="lost">
      <div className="lost__glow" aria-hidden="true" />
      <div className="container lost__inner">
        <p className="kicker">
          <span>404</span>Page not found
        </p>
        <h1 className="lost__title">
          This page <em>burned down</em> in 2001.
        </h1>
        <p className="lost__copy">Whatever used to live here didn&apos;t survive the fire. The rest of the site did.</p>
        <Link className="button button--primary" href="/">
          <span className="roll">
            <span>Back to the new site</span>
          </span>
          <ArrowUpRight size={18} strokeWidth={1.8} aria-hidden="true" />
        </Link>
      </div>
    </main>
  );
}
