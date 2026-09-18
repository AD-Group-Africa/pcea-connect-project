"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { PceaLogoMark } from "@/components/pcea-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function RegisterPage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (!termsAccepted) {
      setError("Please accept the Terms and Privacy Policy to continue.");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/api/auth/register", {
        email,
        password,
        phone,
        termsAccepted,
        fullName: `${firstName} ${lastName}`.trim(),
      });
      if (res.data?.success) {
        setSuccess("Account created! Check your email to verify, then sign in.");
        setTimeout(() => router.push("/login"), 1800);
      } else {
        setError(res.data?.message || "Registration failed.");
      }
    } catch (err: any) {
      if (err.response?.status === 400) {
        setError("This email is already registered. Please sign in instead.");
      } else {
        setError("Network or server error. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const fieldClass = "bg-white/[0.04]";

  return (
    <div className="w-full max-w-md">
      <div className="rounded-2xl border border-white/10 bg-popover/90 p-8 shadow-2xl shadow-black/40 backdrop-blur">
        <div className="mb-6 flex flex-col items-center text-center">
          <PceaLogoMark width={44} height={62} />
          <h1 className="mt-4 text-2xl font-bold text-foreground">Create your account</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Join your congregation on PCEA Connect
          </p>
        </div>

        {error && (
          <p
            role="alert"
            className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-center text-sm text-red-300"
          >
            {error}
          </p>
        )}
        {success && (
          <p
            role="status"
            className="mb-4 rounded-lg border border-green-500/30 bg-green-500/10 px-3 py-2 text-center text-sm text-green-300"
          >
            {success}
          </p>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                type="text"
                autoComplete="given-name"
                placeholder="John"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                className={fieldClass}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                type="text"
                autoComplete="family-name"
                placeholder="Doe"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                className={fieldClass}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={fieldClass}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phone">Phone (optional)</Label>
            <Input
              id="phone"
              type="tel"
              autoComplete="tel"
              inputMode="tel"
              placeholder="0712 345 678"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={fieldClass}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                placeholder="Min 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className={fieldClass}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                placeholder="Re-enter password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className={fieldClass}
              />
            </div>
          </div>

          <div className="flex items-start gap-2.5 pt-1">
            <input
              id="terms"
              type="checkbox"
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded border-input bg-transparent accent-accent"
            />
            <label htmlFor="terms" className="text-xs leading-relaxed text-muted-foreground">
              I have read and agree to the{" "}
              <Link href="/terms" className="font-medium text-accent underline-offset-2 hover:underline">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="font-medium text-accent underline-offset-2 hover:underline">
                Privacy Policy
              </Link>
              , including how my data and my children&apos;s data will be handled.
            </label>
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Creating account…" : "Create Account"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-accent transition-colors hover:text-accent/80">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
