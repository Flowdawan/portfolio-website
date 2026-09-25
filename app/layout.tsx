import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "lenis/dist/lenis.css";
import "./styles/base.css";
import "./styles/intro.css";
import "./styles/chrome.css";
import "./styles/hero.css";
import "./styles/sections.css";
import "./styles/work.css";

const sans = localFont({
  src: "./fonts/HostGrotesk-Variable.woff2",
  variable: "--font-sans",
  weight: "300 800",
  display: "swap",
  fallback: ["system-ui", "Segoe UI", "Helvetica Neue", "Arial", "sans-serif"],
});

const serif = localFont({
  src: [
    { path: "./fonts/InstrumentSerif-Regular.woff2", weight: "400", style: "normal" },
    { path: "./fonts/InstrumentSerif-Italic.woff2", weight: "400", style: "italic" },
  ],
  variable: "--font-serif",
  display: "swap",
  fallback: ["Iowan Old Style", "Georgia", "serif"],
});

const mono = localFont({
  src: "./fonts/GeistMono-Variable.woff2",
  variable: "--font-mono",
  weight: "100 900",
  display: "swap",
  preload: false,
  fallback: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
});

const title = "Florian — Software & AI Engineer";
const description =
  "Florian designs and engineers modern software, AI systems and intelligent workflows — from the first idea to secure production. Based in Austria.";

export const metadata: Metadata = {
  metadataBase: new URL("https://deflow.at"),
  title,
  description,
  keywords: [
    "Software Engineer",
    "AI Engineer",
    "Full Stack Developer",
    "LLM Integration",
    "RAG",
    "AI Agents",
    "React",
    "Next.js",
    "WebGL",
    "Austria",
  ],
  authors: [{ name: "Florian", url: "https://deflow.at" }],
  creator: "Florian",
  alternates: { canonical: "/" },
  openGraph: {
    title,
    description,
    url: "/",
    siteName: "deflow.at",
    type: "website",
    locale: "en_US",
    images: [{ url: "/og.jpg", width: 1200, height: 630, alt: "A 2001 homepage burning away to reveal Florian's new portfolio" }],
  },
  twitter: { card: "summary_large_image", title, description, images: ["/og.jpg"] },
  robots: { index: true, follow: true },
  manifest: "/manifest.json",
  formatDetection: { telephone: false, address: false },
};

export const viewport: Viewport = {
  themeColor: "#0c0a09",
  colorScheme: "dark",
};

// Runs before first paint: flags JS, decides whether the burn intro plays
// (first visit this session, no deep link, no reduced motion — or ?intro), and
// removes the intro again if the app bundle never starts.
const boot = `(function(){var d=document.documentElement;d.classList.add("js");try{var q=new URLSearchParams(location.search);var r=matchMedia("(prefers-reduced-motion: reduce)").matches;var s=sessionStorage.getItem("deflow:intro-seen");if(q.has("intro")||(!r&&!s&&!location.hash)){d.classList.add("is-intro","forge-cold");if("scrollRestoration" in history)history.scrollRestoration="manual";setTimeout(function(){if(!window.__introStarted)d.classList.remove("is-intro","forge-cold")},6000)}}catch(e){}})();`;

const person = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Florian",
  url: "https://deflow.at",
  email: "mailto:vc@deflow.at",
  jobTitle: "Software & AI Engineer",
  address: { "@type": "PostalAddress", addressCountry: "AT" },
  sameAs: ["https://github.com/Flowdawan"],
  knowsAbout: ["Software Engineering", "AI Engineering", "LLM Integration", "RAG", "AI Agents", "TypeScript", "React", "Next.js", "DevOps", "Application Security"],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${sans.variable} ${serif.variable} ${mono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: boot }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(person) }} />
      </head>
      <body>
        {children}
        <div className="grain" aria-hidden="true" />
      </body>
    </html>
  );
}
