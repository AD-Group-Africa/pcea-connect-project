"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { PceaLogoMark } from "@/components/pcea-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function ResetPasswordForm() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"}/api/auth/reset-password`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, newPassword }),
        }
      );
      if (!res.ok) {
        setError("This reset link is invalid or has expired. Please request a new one.");
        return;
      }
      router.push("/login");
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="rounded-2xl border border-white/10 bg-popover/90 p-8 shadow-2xl shadow-black/40 backdrop-blur">
        <div className="mb-8 flex flex-col items-center text-center">
          <PceaLogoMark width={48} height={67} />
          <h1 className="mt-4 text-2xl font-bold text-foreground">Set a new password</h1>
          <p className="mt-1 text-sm text-muted-foreground">Choose a strong password to continue</p>
        </div>

        {!token && (
          <div
            role="alert"
            className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-center text-sm text-red-300"
          >
            This reset link is missing its token. Please use the link from your email.
          </div>
        )}

        {error && (
          <p
            role="alert"
            className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-center text-sm text-red-300"
          >
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="newPassword">New Password</Label>
            <Input
              id="newPassword"
              type="password"
              name="newPassword"
              autoComplete="new-password"
              placeholder="Min 8 characters"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={8}
              className="bg-white/[0.04]"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              name="confirmPassword"
              autoComplete="new-password"
              placeholder="Re-enter password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
              className="bg-white/[0.04]"
            />
          </div>
          <Button type="submit" disabled={loading || !token} className="w-full">
            {loading ? "Resetting…" : "Reset Password"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          <Link href="/login" className="font-medium text-accent transition-colors hover:text-accent/80">
            ← Back to Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-24 text-muted-foreground">Loading…</div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
