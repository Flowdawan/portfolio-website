import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

const centra = localFont({
  src: [
    { path: "../src/assets/font/CentraNo2-Book.ttf", weight: "400" },
    { path: "../src/assets/font/CentraNo2-Medium.ttf", weight: "500" },
    { path: "../src/assets/font/CentraNo2-Bold.ttf", weight: "700" },
  ],
  variable: "--font-centra",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://deflow.at"),
  title: "Florian — Software & AI Engineer",
  description:
    "Florian builds modern software, AI systems and intelligent workflows — from Austria to the web.",
  keywords: [
    "Software Engineer",
    "AI Engineer",
    "Full Stack Developer",
    "LLM Integration",
    "React",
    "Next.js",
    "Austria",
  ],
  authors: [{ name: "Florian" }],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Florian — Software & AI Engineer",
    description: "Modern software, AI systems and intelligent workflows.",
    url: "/",
    siteName: "Florian — Software & AI Engineer",
    type: "website",
    locale: "en_US",
  },
  robots: { index: true, follow: true },
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#07090d",
  colorScheme: "dark",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${centra.variable} antialiased`}>
      <body>{children}</body>
    </html>
  );
}
