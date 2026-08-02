/**
 * Industrial line-art assets for the hero gallery.
 * Replace the <g className="hero-svg__art"> children with raw Blender SVG paths
 * (keep stroke="currentColor", fill="none", strokeWidth inherited from CSS).
 */

type SvgProps = {
  className?: string;
  glowColor: string;
};

const svgBase = {
  viewBox: "0 0 420 420",
  fill: "none",
  xmlns: "http://www.w3.org/2000/svg",
  "aria-hidden": true as const,
};

export function BurnerLineArt({ className, glowColor }: SvgProps) {
  return (
    <svg {...svgBase} className={className} style={{ color: glowColor }}>
      {/* ── PASTE BLENDER BURNER PATHS BELOW ── */}
      <g className="hero-svg__art">
        <ellipse cx="210" cy="250" rx="118" ry="28" />
        <path d="M92 250c18-78 52-148 118-148s100 70 118 148" />
        <path d="M140 250c12-52 34-98 70-98s58 46 70 98" />
        <rect x="186" y="88" width="48" height="36" rx="6" />
        <path d="M198 88V62h24v26" />
        <circle cx="210" cy="250" r="18" />
        <path d="M210 232v-36M192 250h36" />
        <path d="M78 268h264M96 286h228" />
      </g>
    </svg>
  );
}

export function BoilerLineArt({ className, glowColor }: SvgProps) {
  return (
    <svg {...svgBase} className={className} style={{ color: glowColor }}>
      {/* ── PASTE BLENDER BOILER PATHS BELOW ── */}
      <g className="hero-svg__art">
        <rect x="120" y="70" width="180" height="280" rx="18" />
        <rect x="148" y="108" width="124" height="160" rx="8" />
        <circle cx="210" cy="188" r="42" />
        <circle cx="210" cy="188" r="18" />
        <path d="M176 300h68M176 318h68" />
        <path d="M210 70V48M196 48h28" />
        <path d="M300 120h36v40M300 220h36v40" />
        <path d="M120 340h180" />
      </g>
    </svg>
  );
}

export function PumpLineArt({ className, glowColor }: SvgProps) {
  return (
    <svg {...svgBase} className={className} style={{ color: glowColor }}>
      {/* ── PASTE BLENDER PUMP PATHS BELOW ── */}
      <g className="hero-svg__art">
        <circle cx="210" cy="210" r="78" />
        <circle cx="210" cy="210" r="42" />
        <circle cx="210" cy="210" r="14" />
        <path d="M210 132v-40h54" />
        <path d="M288 210h52v36H288" />
        <path d="M132 210H80v36h52" />
        <path d="M168 288l-28 48h124l-28-48" />
        <path d="M176 188l34-34 34 34-34 34z" />
      </g>
    </svg>
  );
}
