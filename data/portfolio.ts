export type PreviewKind = "perceptron" | "marble" | "ink" | "bits";

export type Project = {
  title: string;
  eyebrow: string;
  description: string;
  live?: string;
  github?: string;
  actionLabel?: string;
  tags: string[];
  featured?: boolean;
  /** Live, interactive canvas sketch rendered as the project thumbnail. */
  preview?: PreviewKind;
  /** One-line hint rendered on the preview, e.g. how to interact with it. */
  previewHint?: string;
};

// Projektliste = Project-Factory-Projekte (ohne *_private) + sherl.at.
// Gebaute Quellen liegen in ../project-factory/projects/. Die Live-URLs folgen
// der deflow.at-Subdomain-Konvention (<ordner>.deflow.at) — bei abweichendem
// Deploy-Ziel hier anpassen.
export const projects: Project[] = [
  {
    title: "Sherl",
    eyebrow: "Featured web app · sherl.at",
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
    live: "https://neuron.deflow.at",
    actionLabel: "Open experiment",
    tags: ["AI", "Machine Learning", "Interactive", "Education"],
    preview: "perceptron",
    previewHint: "Hover to probe the neuron",
  },
  {
    title: "Marble Machine",
    eyebrow: "Generative sound toy",
    description:
      "A mobile-first, generative marble run: tap pegs, ramps, bumpers and funnels onto the grid and let falling marbles trigger pentatonic tones. Pure Canvas + Web Audio — no build tools, no libraries, no network at runtime.",
    live: "https://marble.deflow.at",
    actionLabel: "Open experiment",
    tags: ["Canvas", "Web Audio", "Generative", "Mobile"],
    preview: "marble",
    previewHint: "Hover to drop marbles",
  },
  {
    title: "Fluid Ink",
    eyebrow: "WebGL experiment",
    description:
      "A real-time, interactive WebGL fluid-ink simulation you can stir with your cursor — pure GPU shaders, no dependencies, running entirely in the browser.",
    live: "https://ink.deflow.at",
    actionLabel: "Open experiment",
    tags: ["WebGL", "Shaders", "Generative", "Interactive"],
    preview: "ink",
    previewHint: "Hover to stir the ink",
  },
  {
    title: "From Switch to Thought",
    eyebrow: "Interactive scrollytelling",
    description:
      "A scrollytelling one-pager tracing a short history of computing — from the ENIAC's switches to the thinking machine — told through scroll-driven motion and type.",
    live: "https://bits.deflow.at",
    actionLabel: "Open experiment",
    tags: ["Scrollytelling", "One-Pager", "History", "Interactive"],
    preview: "bits",
    previewHint: "Hover to flip the switches",
  },
];

export type SkillVisual = "neural" | "code" | "pipeline" | "shield";

export type SkillGroup = {
  index: string;
  title: string;
  description: string;
  visual: SkillVisual;
  skills: string[];
};

export const skillGroups: SkillGroup[] = [
  {
    index: "01",
    title: "AI engineering",
    description: "From a useful prompt to a dependable production workflow.",
    visual: "neural",
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
    visual: "code",
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
    visual: "pipeline",
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
    visual: "shield",
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

export const contact = {
  email: "vc@deflow.at",
  github: "https://github.com/Flowdawan",
  repositories: "https://github.com/Flowdawan?tab=repositories",
  publicKey: "/publickey_deflow.asc",
};
