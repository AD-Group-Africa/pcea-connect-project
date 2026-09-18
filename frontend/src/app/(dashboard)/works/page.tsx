"use client";
import Link from "next/link";
import { BriefcaseBusiness, ArrowUpRight, Users, Wrench, GraduationCap, Church } from "lucide-react";

/**
 * PCEA Works entry point.
 *
 * Works is a separate ecosystem product ("connect people to opportunities").
 * Connect's job is a clear doorway — not to host the marketplace itself.
 * When the Works platform URL is configured, this page hands off to it;
 * otherwise it explains the relationship honestly (no fake listings).
 */
export default function WorksPage() {
  const worksUrl = process.env.NEXT_PUBLIC_WORKS_URL;

  return (
    <div className="mx-auto max-w-3xl space-y-8 py-6">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/10">
          <BriefcaseBusiness className="h-8 w-8 text-accent" aria-hidden="true" />
        </div>
        <h1 className="text-3xl font-bold text-white">PCEA Works</h1>
        <p className="mx-auto mt-2 max-w-xl text-muted-foreground">
          Find jobs, gigs, services and opportunities within the wider PCEA community &mdash;
          skills offered, roles needed, and professionals ready to serve.
        </p>
      </div>

      {worksUrl ? (
        <div className="text-center">
          <a
            href={worksUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-3 font-semibold text-black transition-colors hover:bg-accent/90"
          >
            Open PCEA Works <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </a>
          <p className="mt-2 text-xs text-muted-foreground">Opens the Works platform in a new tab.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-white/10 bg-card p-5 text-center">
          <p className="text-sm text-foreground">
            The Works platform is launching soon. Your church profile and ministry
            participation here on Connect will carry into Works when it opens.
          </p>
        </div>
      )}

      <section aria-labelledby="how-it-works">
        <h2 id="how-it-works" className="mb-3 text-lg font-semibold text-white">
          How Connect and Works fit together
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-white/10 bg-card p-4">
            <Church className="mb-2 h-5 w-5 text-accent" aria-hidden="true" />
            <h3 className="font-medium text-white">Connect — church life</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Worship, ministries, events, giving and congregational communication. You are here.
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-card p-4">
            <BriefcaseBusiness className="mb-2 h-5 w-5 text-accent" aria-hidden="true" />
            <h3 className="font-medium text-white">Works — opportunities</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Jobs, gigs and professional services across the PCEA community, linked to your Connect identity.
            </p>
          </div>
        </div>
      </section>

      <section aria-labelledby="who-it-serves">
        <h2 id="who-it-serves" className="mb-3 text-lg font-semibold text-white">
          Built for the whole community
        </h2>
        <ul className="grid gap-3 sm:grid-cols-3">
          <li className="rounded-xl border border-white/10 bg-card p-4">
            <Users className="mb-2 h-5 w-5 text-blue-400" aria-hidden="true" />
            <p className="text-sm font-medium text-white">Members seeking work</p>
            <p className="mt-1 text-xs text-muted-foreground">Roles and gigs from trusted fellow members.</p>
          </li>
          <li className="rounded-xl border border-white/10 bg-card p-4">
            <Wrench className="mb-2 h-5 w-5 text-blue-400" aria-hidden="true" />
            <p className="text-sm font-medium text-white">Professionals offering services</p>
            <p className="mt-1 text-xs text-muted-foreground">Trades, counsel and craft, community-verified.</p>
          </li>
          <li className="rounded-xl border border-white/10 bg-card p-4">
            <GraduationCap className="mb-2 h-5 w-5 text-blue-400" aria-hidden="true" />
            <p className="text-sm font-medium text-white">Youth building careers</p>
            <p className="mt-1 text-xs text-muted-foreground">Mentorship and first opportunities.</p>
          </li>
        </ul>
      </section>

      <p className="text-center text-sm">
        <Link href="/dashboard" className="text-blue-400 hover:underline">
          Back to My Church
        </Link>
      </p>
    </div>
  );
}
