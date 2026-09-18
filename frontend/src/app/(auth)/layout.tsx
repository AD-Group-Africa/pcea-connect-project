import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-background px-4 py-10">
      {/* Ambient brand glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 left-1/2 h-96 w-[52rem] max-w-full -translate-x-1/2 rounded-full opacity-25 blur-3xl"
        style={{ background: "radial-gradient(closest-side, #1A3C8F, transparent)" }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-48 right-[-10rem] h-96 w-96 rounded-full opacity-15 blur-3xl"
        style={{ background: "radial-gradient(closest-side, #E2A619, transparent)" }}
      />

      <div className="relative z-10 flex flex-1 items-center justify-center">{children}</div>

      <footer className="relative z-10 mt-10 flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-xs text-muted-foreground">
        <span>PCEA Connect — The Digital Church</span>
        <Link href="/privacy" className="transition-colors hover:text-foreground">
          Privacy
        </Link>
        <Link href="/terms" className="transition-colors hover:text-foreground">
          Terms
        </Link>
        <Link href="/child-privacy" className="transition-colors hover:text-foreground">
          Child Privacy
        </Link>
        <Link href="/support" className="transition-colors hover:text-foreground">
          Support
        </Link>
      </footer>
    </div>
  );
}
