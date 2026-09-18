"use client";

import { useState } from "react";
import Link from "next/link";
import { PceaLogoMark } from "@/components/pcea-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Fire-and-forget: the endpoint always answers the same way to avoid
      // revealing which emails exist.
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"}/api/auth/forgot-password`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        }
      ).catch(() => {});
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="rounded-2xl border border-white/10 bg-popover/90 p-8 shadow-2xl shadow-black/40 backdrop-blur">
        <div className="mb-8 flex flex-col items-center text-center">
          <PceaLogoMark width={48} height={67} />
          <h1 className="mt-4 text-2xl font-bold text-foreground">Forgot password</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Enter your email and we&apos;ll send you a reset link
          </p>
        </div>

        {sent ? (
          <div
            role="status"
            className="rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-4 text-center"
          >
            <p className="text-sm font-medium text-green-300">Check your inbox</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              If an account exists for {email}, a password reset link is on its way.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                name="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-white/[0.04]"
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Sending…" : "Send Reset Link"}
            </Button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-muted-foreground">
          <Link href="/login" className="font-medium text-accent transition-colors hover:text-accent/80">
            ← Back to Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
