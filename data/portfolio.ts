export type Project = {
  title: string;
  eyebrow: string;
  description: string;
  image?: string;
  /** CSS background value used as a generated poster when no screenshot exists. */
  poster?: string;
  live?: string;
  github?: string;
  actionLabel?: string;
  tags: string[];
  featured?: boolean;
};

// Projektliste = Project-Factory-Projekte (ohne *_private) + sherl.at.
// Gebaute Quellen liegen in ../project-factory/projects/. Die Live-URLs folgen
// der deflow.at-Subdomain-Konvention (<ordner>.deflow.at) — bei abweichendem
// Deploy-Ziel hier anpassen.
export const projects: Project[] = [
  {
    title: "Sherl — sherl.at",
    eyebrow: "Featured web app",
    description:
      "A free multiplayer estimation quiz for pub-quiz nights. Players estimate answers, place chips and turn a shared room into a fast, social game — no real money involved.",
    live: "https://sherl.at",
    actionLabel: "Play live",
    tags: ["Multiplayer", "PWA", "Game Design", "Web App"],
    featured: true,
  },
  {
    title: "Perceptron Playground",
    eyebrow: "Interactive AI explainer",
    description:
      "An interactive perceptron you can teach by hand: drop points, rotate the weight vector and watch a single artificial neuron learn to separate two classes — AI explained at its smallest unit.",
    poster: "linear-gradient(135deg, #120a26 0%, #1d1140 55%, #0a1830 100%)",
    live: "https://neuron.deflow.at",
    actionLabel: "Open experiment",
    tags: ["AI", "Machine Learning", "Interactive", "Education"],
  },
  {
    title: "Marble Machine",
    eyebrow: "Generative sound toy",
    description:
      "A mobile-first, generative marble run: tap pegs, ramps, bumpers and funnels onto the grid and let falling marbles trigger pentatonic tones. Pure Canvas + Web Audio — no build tools, no libraries, no network at runtime.",
    poster: "linear-gradient(135deg, #0b0e14 0%, #102331 55%, #063038 100%)",
    live: "https://marble.deflow.at",
    actionLabel: "Open experiment",
    tags: ["Canvas", "Web Audio", "Generative", "Mobile"],
  },
  {
    title: "Fluid Ink",
    eyebrow: "WebGL experiment",
    description:
      "A real-time, interactive WebGL fluid-ink simulation you can stir with your cursor — pure GPU shaders, no dependencies, running entirely in the browser.",
    poster: "linear-gradient(135deg, #05060a 0%, #101a33 55%, #1a1030 100%)",
    live: "https://ink.deflow.at",
    actionLabel: "Open experiment",
    tags: ["WebGL", "Shaders", "Generative", "Interactive"],
  },
  {
    title: "From Switch to Thought",
    eyebrow: "Interactive scrollytelling",
    description:
      "A scrollytelling one-pager tracing a short history of computing — from the ENIAC's switches to the thinking machine — told through scroll-driven motion and type.",
    poster: "linear-gradient(135deg, #1b1205 0%, #3a2a0c 55%, #2a0f0a 100%)",
    live: "https://bits.deflow.at",
    actionLabel: "Open experiment",
    tags: ["Scrollytelling", "One-Pager", "History", "Interactive"],
  },
];

export const skillGroups = [
  {
    index: "01",
    title: "AI engineering",
    description: "From a useful prompt to a dependable production workflow.",
    accent: "violet",
    skills: [
      "AI",
      "Claude",
      "ChatGPT",
      "Prompt Engineering",
      "AI Workflows",
      "AI Agents",
      "LLM Integration",
      "RAG",
      "MCP",
      "Automation",
    ],
  },
  {
    index: "02",
    title: "Development",
    description: "Products built from interface through API and architecture.",
    accent: "cyan",
    skills: [
      "Full Stack Development",
      "TypeScript",
      "React",
      "Next.js",
      "Node.js",
      "Python",
      "APIs",
      "System Design",
      "Laravel",
      "Kotlin",
      "Android Jetpack Compose",
      "HTML5 / CSS",
      "Java",
      "C",
      "C++",
      "Unity Game Development",
    ],
  },
  {
    index: "03",
    title: "Systems & delivery",
    description: "The infrastructure and automation that keep software moving.",
    accent: "acid",
    skills: [
      "DevOps",
      "Docker",
      "Linux",
      "CI/CD",
      "GitHub Actions",
      "Infrastructure",
      "Cloud",
      "Deployment",
      "Kubernetes",
      "Bitrise Mobile CI/CD",
      "Network Engineering",
    ],
  },
  {
    index: "04",
    title: "Security",
    description: "Security designed in, not bolted on at the end.",
    accent: "orange",
    skills: [
      "Security",
      "Security Best Practices",
      "Authentication",
      "Authorization",
      "OWASP",
      "Secure Development",
      "API Security",
      "IT Security Fundamentals",
    ],
  },
];
