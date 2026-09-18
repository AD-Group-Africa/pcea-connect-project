"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import api from "@/lib/api";
import { PceaLogoMark } from "@/components/pcea-logo";
import {
  Church, Clock, MapPin, Phone, Mail, Video, Globe, ArrowRight, CalendarDays, Navigation, Loader2,
} from "lucide-react";

interface ChurchProfile {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  serviceTimes: string;
  phone: string;
  email: string;
  livestreamUrl: string;
  website: string;
}

/**
 * Public church profile (Journey A: visitor).
 * A visitor should be able to understand a congregation — service times,
 * location, contacts, livestream — without creating an account.
 */
export default function ChurchProfilePage() {
  const { id } = useParams<{ id: string }>();
  const [church, setChurch] = useState<ChurchProfile | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "notfound" | "error">("loading");

  useEffect(() => {
    if (!id) return;
    api.get(`/api/locator/${id}`)
      .then((res) => {
        const data = res.data?.data;
        if (data?.id) { setChurch(data); setState("ready"); }
        else setState("notfound");
      })
      .catch(() => setState("error"));
  }, [id]);

  const hasLocation = church && (church.latitude !== 0 || church.longitude !== 0);
  const mapsUrl = hasLocation
    ? `https://www.google.com/maps/search/?api=1&query=${church!.latitude},${church!.longitude}`
    : church?.address
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(church.address)}`
      : null;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2" aria-label="PCEA Connect home">
            <PceaLogoMark width={22} height={30} />
            <span className="font-semibold text-white">PCEA Connect</span>
          </Link>
          <Link
            href="/login"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
          >
            Sign in
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10">
        {state === "loading" && (
          <div className="flex items-center justify-center gap-3 py-24 text-muted-foreground" role="status">
            <Loader2 className="h-6 w-6 animate-spin" aria-hidden="true" /> Loading church profile…
          </div>
        )}

        {state === "error" && (
          <div className="py-24 text-center">
            <Church className="mx-auto mb-3 h-12 w-12 text-muted-foreground" aria-hidden="true" />
            <h1 className="text-xl font-semibold text-white">Something went wrong</h1>
            <p className="mt-1 text-sm text-muted-foreground">We could not load this church profile. Please try again later.</p>
          </div>
        )}

        {state === "notfound" && (
          <div className="py-24 text-center">
            <Church className="mx-auto mb-3 h-12 w-12 text-muted-foreground" aria-hidden="true" />
            <h1 className="text-xl font-semibold text-white">Church not found</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              This congregation does not have a profile yet.{" "}
              <Link href="/locator" className="text-blue-400 hover:underline">Browse PCEA churches</Link>
            </p>
          </div>
        )}

        {state === "ready" && church && (
          <div className="space-y-8">
            {/* Identity */}
            <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary/20">
                <PceaLogoMark width={32} height={44} />
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-widest text-accent">
                  Presbyterian Church of East Africa
                </p>
                <h1 className="mt-1 text-3xl font-bold text-white sm:text-4xl">{church.name}</h1>
                {church.address && (
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" /> {church.address}
                  </p>
                )}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {/* Service times */}
              {church.serviceTimes && (
                <section aria-labelledby="service-times" className="rounded-xl border border-white/10 bg-card p-5">
                  <h2 id="service-times" className="mb-3 flex items-center gap-2 font-semibold text-white">
                    <Clock className="h-5 w-5 text-accent" aria-hidden="true" /> Service times
                  </h2>
                  <p className="whitespace-pre-line text-sm text-muted-foreground">{church.serviceTimes}</p>
                </section>
              )}

              {/* Contact */}
              {(church.phone || church.email) && (
                <section aria-labelledby="contact" className="rounded-xl border border-white/10 bg-card p-5">
                  <h2 id="contact" className="mb-3 flex items-center gap-2 font-semibold text-white">
                    <Phone className="h-5 w-5 text-accent" aria-hidden="true" /> Contact
                  </h2>
                  <div className="space-y-2 text-sm">
                    {church.phone && (
                      <a href={`tel:${church.phone.replace(/\s/g, "")}`} className="flex items-center gap-2 text-muted-foreground hover:text-white">
                        <Phone className="h-4 w-4 shrink-0" aria-hidden="true" /> {church.phone}
                      </a>
                    )}
                    {church.email && (
                      <a href={`mailto:${church.email}`} className="flex items-center gap-2 text-muted-foreground hover:text-white">
                        <Mail className="h-4 w-4 shrink-0" aria-hidden="true" /> {church.email}
                      </a>
                    )}
                  </div>
                </section>
              )}

              {/* Worship online */}
              {(church.livestreamUrl || church.website) && (
                <section aria-labelledby="online" className="rounded-xl border border-white/10 bg-card p-5">
                  <h2 id="online" className="mb-3 flex items-center gap-2 font-semibold text-white">
                    <Video className="h-5 w-5 text-accent" aria-hidden="true" /> Worship online
                  </h2>
                  <div className="space-y-2 text-sm">
                    {church.livestreamUrl && (
                      <a href={church.livestreamUrl} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-2 text-blue-400 hover:underline">
                        <Video className="h-4 w-4 shrink-0" aria-hidden="true" /> Join the livestream
                      </a>
                    )}
                    {church.website && (
                      <a href={church.website} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-2 text-blue-400 hover:underline">
                        <Globe className="h-4 w-4 shrink-0" aria-hidden="true" /> Church website
                      </a>
                    )}
                  </div>
                </section>
              )}

              {/* Visit us */}
              {mapsUrl && (
                <section aria-labelledby="visit" className="rounded-xl border border-white/10 bg-card p-5">
                  <h2 id="visit" className="mb-3 flex items-center gap-2 font-semibold text-white">
                    <Navigation className="h-5 w-5 text-accent" aria-hidden="true" /> Visit us
                  </h2>
                  <a href={mapsUrl} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-blue-400 hover:underline">
                    <MapPin className="h-4 w-4" aria-hidden="true" /> Get directions
                  </a>
                </section>
              )}
            </div>

            {/* CTA */}
            <section className="rounded-xl border border-accent/30 bg-accent/5 p-6 text-center">
              <h2 className="text-lg font-semibold text-white">This is your church, online.</h2>
              <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
                Sign in to see announcements, events, ministries, the livestream and previous
                services for {church.name}.
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-3">
                <Link href="/login"
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 font-semibold text-white transition-colors hover:bg-primary/90">
                  Sign in <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
                <Link href="/register"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-5 py-2.5 font-semibold text-white transition-colors hover:bg-white/5">
                  <CalendarDays className="h-4 w-4" aria-hidden="true" /> Join this congregation
                </Link>
              </div>
            </section>
          </div>
        )}
      </main>

      <footer className="border-t border-white/10 py-6 text-center text-xs text-muted-foreground">
        <Link href="/locator" className="hover:text-white">Find more PCEA churches</Link>
        <span className="mx-2" aria-hidden="true">·</span>
        A product of Afrika Digitalis
      </footer>
    </div>
  );
}
