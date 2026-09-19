import { useId } from "react";

/**
 * The Dough n Frost mark: a frosted doughnut drawn in one colour. The dough ring is cut by the
 * drip line of the frosting, the hole and five sprinkles, so it reads at favicon size and on
 * any background. The same geometry lives in public/favicon.svg and scripts/make_icons.py.
 */
export const MARK = {
  viewBox: "0 0 100 100",
  ring: { cx: 50, cy: 50, r: 46 },
  hole: { cx: 50, cy: 50, r: 15 },
  /** Where the frosting stops: a wavy edge with drips, cut as a 5-unit gap. */
  drip: "M0 62 C8 62 10 74 16 74 C22 74 22 66 28 66 C34 66 34 82 41 82 C48 82 47 70 53 70 C59 70 59 78 65 78 C71 78 71 65 77 65 C83 65 84 74 90 74 C95 74 96 66 100 64",
  /** Sprinkles as [x, y, angle in degrees]; each is a 10 × 5 capsule. */
  sprinkles: [
    [29, 27, -35],
    [50, 15, 10],
    [71, 26, 50],
    [21, 47, 80],
    [79, 45, -15],
  ] as const,
};

export function LogoMark({ size = 32, className, title }: { size?: number; className?: string; title?: string }) {
  const mask = `dnf-${useId().replace(/:/g, "")}`;
  return (
    <svg
      viewBox={MARK.viewBox}
      width={size}
      height={size}
      className={className}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      fill="currentColor"
    >
      <defs>
        <mask id={mask} maskUnits="userSpaceOnUse" x="0" y="0" width="100" height="100">
          <rect width="100" height="100" fill="#fff" />
          <circle {...MARK.hole} fill="#000" />
          <path d={MARK.drip} fill="none" stroke="#000" strokeWidth="5" />
          {MARK.sprinkles.map(([x, y, angle]) => (
            <line key={`${x}-${y}`} x1={x - 5} y1={y} x2={x + 5} y2={y} stroke="#000" strokeWidth="5" strokeLinecap="round" transform={`rotate(${angle} ${x} ${y})`} />
          ))}
        </mask>
      </defs>
      <circle {...MARK.ring} mask={`url(#${mask})`} />
    </svg>
  );
}

export function AppIcon({ size = 40 }: { size?: number }) {
  return (
    <span className="app-icon" style={{ width: size, height: size, borderRadius: size * 0.26 }}>
      <LogoMark size={size * 0.64} />
    </span>
  );
}
