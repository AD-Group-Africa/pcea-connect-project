import { PCEA_BRAND } from "@/lib/brand";
import { cn } from "@/lib/utils";

/**
 * The PCEA Connect mark — the PCEA cross rendered in brand navy and gold.
 * Drop-in replacement for the inline SVGs previously duplicated across
 * the landing page, auth screens and dashboard header.
 */
export function PceaLogoMark({
  width = 26,
  height = 36,
  className,
}: {
  width?: number;
  height?: number;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 100 140"
      width={width}
      height={height}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <path
        d="M35 0 L40 0 L40 45 L0 45 L0 50 L40 50 L40 95 L35 95 L35 140 L40 140 L40 95 L100 95 L100 90 L40 90 L40 50 L60 50 L60 45 L40 45 L40 0 Z"
        fill={PCEA_BRAND.navy}
      />
      <path
        d="M40 0 L45 0 L45 45 L100 45 L100 50 L45 50 L45 90 L100 90 L100 95 L45 95 L45 140 L40 140 L40 0 Z"
        fill={PCEA_BRAND.gold}
      />
      <rect x="39.5" y="0" width="1" height="140" fill="white" />
    </svg>
  );
}

/** Logo + wordmark lock-up used in the dashboard header and landing page. */
export function PceaLogoLockup({
  className,
  markSize = 22,
}: {
  className?: string;
  markSize?: number;
}) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <PceaLogoMark width={markSize} height={Math.round(markSize * 1.4)} />
      <span className="text-lg font-bold tracking-tight text-foreground">
        PCEA <span className="text-accent">Connect</span>
      </span>
    </span>
  );
}
