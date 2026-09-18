"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { PceaLogoMark } from "@/components/pcea-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.post("/api/auth/login", { email, password });
      const data = res.data?.data;
      if (data?.accessToken) {
        localStorage.setItem("token", data.accessToken);
        localStorage.setItem(
          "user",
          JSON.stringify({ id: data.userId, name: data.fullName || email.split("@")[0] })
        );
        router.push("/dashboard");
      } else {
        setError("Login failed. Please try again.");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="rounded-2xl border border-white/10 bg-popover/90 p-8 shadow-2xl shadow-black/40 backdrop-blur">
        <div className="mb-8 flex flex-col items-center text-center">
          <PceaLogoMark width={52} height={73} />
          <h1 className="mt-5 text-2xl font-bold text-foreground">Welcome back</h1>
          <p className="mt-1 text-sm text-muted-foreground">Sign in to your PCEA Connect account</p>
        </div>

        {error && (
          <p
            role="alert"
            className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-center text-sm text-red-300"
          >
            {error}
          </p>
        )}

        <form onSubmit={handleLogin} className="space-y-4" noValidate={false}>
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
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link
                href="/forgot-password"
                className="text-xs font-medium text-accent transition-colors hover:text-accent/80"
              >
                Forgot password?
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              name="password"
              autoComplete="current-password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="bg-white/[0.04]"
            />
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Signing in…" : "Sign In"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="font-semibold text-accent transition-colors hover:text-accent/80">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
