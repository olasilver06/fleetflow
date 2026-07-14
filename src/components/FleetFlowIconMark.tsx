// Just the mark from FleetFlowLogo, colored via currentColor so it can be
// dropped onto non-surface backgrounds (e.g. white-on-primary CTA bars)
// without hardcoding a color that would clash with the container.
export default function FleetFlowIconMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 56 52" className={className} role="img" aria-label="FleetFlow">
      <polygon points="7.9,4 44,4 38.2,14 2.1,14" fill="currentColor" />
      <polygon points="14.6,20 42.6,20 37.9,30 9.9,30" fill="currentColor" opacity="0.68" />
      <polygon points="19.9,36 38,36 34.5,46 16.4,46" fill="currentColor" opacity="0.4" />
    </svg>
  );
}
