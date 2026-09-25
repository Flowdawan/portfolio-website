import type { CSSProperties } from "react";
import type { SkillVisual as SkillVisualKind } from "@/data/portfolio";

// Small, CSS-animated line drawings — one per discipline. Pure SVG, so they are
// crisp at any size, cost nothing to download and pause when off-screen.

const d = (value: number) => ({ "--d": value }) as CSSProperties;

function Neural() {
  const layers = [
    { x: 58, ys: [104, 150, 196] },
    { x: 158, ys: [66, 122, 178, 234] },
    { x: 258, ys: [66, 122, 178, 234] },
    { x: 346, ys: [124, 176] },
  ];
  const edges: Array<[number, number, number, number]> = [];
  layers.slice(0, -1).forEach((layer, index) => {
    const next = layers[index + 1];
    layer.ys.forEach((y1) => next.ys.forEach((y2) => edges.push([layer.x, y1, next.x, y2])));
  });

  return (
    <svg viewBox="0 0 400 300" className="viz viz--neural">
      <g className="viz-edges">
        {edges.map(([x1, y1, x2, y2], index) => (
          <line key={index} x1={x1} y1={y1} x2={x2} y2={y2} />
        ))}
      </g>
      <g className="viz-pulses">
        {edges
          .filter((_, index) => index % 3 === 0)
          .map(([x1, y1, x2, y2], index) => (
            <line key={index} x1={x1} y1={y1} x2={x2} y2={y2} pathLength={100} style={d(index)} />
          ))}
      </g>
      <g className="viz-nodes">
        {layers.flatMap((layer, layerIndex) =>
          layer.ys.map((y, nodeIndex) => (
            <circle key={`${layerIndex}-${nodeIndex}`} cx={layer.x} cy={y} r={6} style={d(layerIndex * 4 + nodeIndex)} />
          )),
        )}
      </g>
      <text x="58" y="276" className="viz-caption">
        input
      </text>
      <text x="208" y="276" className="viz-caption" textAnchor="middle">
        reasoning
      </text>
      <text x="346" y="276" className="viz-caption" textAnchor="end">
        output
      </text>
    </svg>
  );
}

function Code() {
  const lines: Array<Array<[number, number, string]>> = [
    [[0, 34, "k"], [38, 58, "f"], [100, 20, "p"]],
    [[16, 44, "d"], [64, 88, "s"]],
    [[16, 30, "k"], [50, 70, "f"], [124, 40, "p"]],
    [[32, 96, "s"], [132, 26, "d"]],
    [[32, 52, "f"], [88, 60, "p"]],
    [[16, 18, "d"]],
    [[16, 36, "k"], [56, 110, "s"]],
    [[0, 10, "d"]],
  ];
  return (
    <svg viewBox="0 0 400 300" className="viz viz--code">
      <rect x="30" y="34" width="340" height="232" rx="16" className="viz-frame" />
      <line x1="30" y1="70" x2="370" y2="70" className="viz-divider" />
      <circle cx="52" cy="52" r="4.5" className="viz-dot" />
      <circle cx="68" cy="52" r="4.5" className="viz-dot" />
      <circle cx="84" cy="52" r="4.5" className="viz-dot" />
      <text x="200" y="56" textAnchor="middle" className="viz-caption">
        agent.ts
      </text>
      {lines.map((segments, index) => (
        <g className="viz-line" style={d(index)} key={index} transform={`translate(0 ${92 + index * 19})`}>
          <rect x="46" y="-3" width="10" height="5" rx="2.5" className="viz-lineno" />
          {segments.map(([x, width, tone], segmentIndex) => (
            <rect key={segmentIndex} x={72 + x} y="-4" width={width} height="7" rx="3.5" className={`viz-tok viz-tok--${tone}`} />
          ))}
        </g>
      ))}
      <rect x="90" y="226" width="2" height="12" className="viz-caret" />
      <g className="viz-badge" transform="translate(262 232)">
        <rect x="0" y="-12" width="96" height="22" rx="11" />
        <text x="48" y="3" textAnchor="middle">
          ✓ tests passing
        </text>
      </g>
    </svg>
  );
}

function Pipeline() {
  const stages = ["build", "test", "ship", "observe"];
  const xs = [64, 154, 246, 336];
  return (
    <svg viewBox="0 0 400 300" className="viz viz--pipeline">
      <line x1="64" y1="118" x2="336" y2="118" className="viz-rail" />
      <line x1="64" y1="118" x2="336" y2="118" className="viz-rail-fill" />
      {stages.map((stage, index) => (
        <g key={stage} className="viz-stage" style={d(index)}>
          <circle cx={xs[index]} cy="118" r="20" />
          <path d={`M${xs[index] - 6} 118l4.5 4.5 8-9`} className="viz-check" />
          <text x={xs[index]} y="164" textAnchor="middle" className="viz-caption">
            {stage}
          </text>
        </g>
      ))}
      <circle cx="64" cy="118" r="5" className="viz-token" />
      <g className="viz-log">
        <text x="64" y="212" style={d(0)}>
          ✓ build · 1.8s
        </text>
        <text x="64" y="234" style={d(1)}>
          ✓ 214 tests · 0 flaky
        </text>
        <text x="64" y="256" style={d(2)}>
          ✓ deployed · healthy
        </text>
      </g>
    </svg>
  );
}

function Shield() {
  const rings = [
    { r: 38, dash: "3 7", cls: "a" },
    { r: 66, dash: "18 10", cls: "b" },
    { r: 96, dash: "1.5 6", cls: "c" },
    { r: 126, dash: "46 14", cls: "d" },
  ];
  const blips = [
    [262, 96],
    [118, 186],
    [300, 196],
    [150, 70],
    [230, 236],
  ];
  return (
    <svg viewBox="0 0 400 300" className="viz viz--shield">
      <defs>
        <linearGradient id="scan-gradient" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="var(--ember)" stopOpacity="0" />
          <stop offset="1" stopColor="var(--ember)" stopOpacity="0.34" />
        </linearGradient>
      </defs>
      {rings.map((ring) => (
        <circle key={ring.r} cx="200" cy="150" r={ring.r} strokeDasharray={ring.dash} className={`viz-ring viz-ring--${ring.cls}`} />
      ))}
      <path d="M200 150 L326 150 A126 126 0 0 0 296.5 69 Z" className="viz-scan" fill="url(#scan-gradient)" />
      {blips.map(([x, y], index) => (
        <circle key={index} cx={x} cy={y} r="3" className="viz-blip" style={d(index)} />
      ))}
      <g className="viz-lock">
        <path d="M188 146v-9a12 12 0 0 1 24 0v9" />
        <rect x="181" y="146" width="38" height="30" rx="7" />
        <circle cx="200" cy="159" r="3.2" className="viz-keyhole" />
        <line x1="200" y1="162" x2="200" y2="168" className="viz-keyhole-line" />
      </g>
    </svg>
  );
}

export function SkillVisual({ kind }: { kind: SkillVisualKind }) {
  switch (kind) {
    case "neural":
      return <Neural />;
    case "code":
      return <Code />;
    case "pipeline":
      return <Pipeline />;
    case "shield":
      return <Shield />;
  }
}
