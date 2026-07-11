// Inlined (not <img src="...">) so its fill colors can reference the same
// theme CSS variables as the rest of the app — an <img>-referenced SVG is
// rendered in an isolated document and can't pick up currentColor/CSS vars,
// which left the wordmark's near-white text invisible in light mode.
export default function FleetFlowLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 900 220" className={className} role="img" aria-label="FleetFlow">
      <g transform="translate(40,50)">
        <polygon points="17.2,9 98,9 84,30 4.6,30" fill="var(--color-primary)" />
        <polygon
          points="31.9,43 90,43 79.6,64 21.7,64"
          fill="var(--color-primary)"
          opacity="0.68"
        />
        <polygon
          points="43.6,77 81,77 74.7,98 35.9,98"
          fill="var(--color-primary)"
          opacity="0.4"
        />
      </g>
      <text
        x="194"
        y="148"
        fontFamily="'Inter Tight','Inter',sans-serif"
        fontWeight="800"
        fontSize="96"
        letterSpacing="-2"
        fill="var(--color-text-primary)"
      >
        Fleet<tspan fill="var(--color-primary)">Flow</tspan>
      </text>
    </svg>
  );
}
