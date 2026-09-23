export function TimelineRuler({ className }: { className?: string }) {
  // 20 major ticks with timecode labels every 4th tick, minor ticks between.
  const majorEvery = 4;
  const totalTicks = 40;

  return (
    <svg
      viewBox="0 0 1200 28"
      preserveAspectRatio="none"
      className={className}
      aria-hidden="true"
    >
      <line x1="0" y1="27" x2="1200" y2="27" className="stroke-border" strokeWidth="1" />
      {Array.from({ length: totalTicks + 1 }).map((_, i) => {
        const x = (i / totalTicks) * 1200;
        const isMajor = i % majorEvery === 0;
        return (
          <g key={i}>
            <line
              x1={x}
              y1={isMajor ? 12 : 18}
              x2={x}
              y2="27"
              className={isMajor ? "stroke-foreground/40" : "stroke-border"}
              strokeWidth="1"
            />
            {isMajor && (
              <text
                x={x + 4}
                y="10"
                className="fill-muted-foreground font-mono"
                style={{ fontSize: "9px" }}
              >
                {String(Math.floor(i / majorEvery)).padStart(2, "0")}:00
              </text>
            )}
          </g>
        );
      })}
      {/* Playhead marker — the single signal-colored accent on the page */}
      <polygon points="140,0 152,0 146,10" className="fill-signal" />
      <line x1="146" y1="0" x2="146" y2="27" className="stroke-signal" strokeWidth="1.5" />
    </svg>
  );
}
