"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-background px-6 text-center">
      <h1 className="text-2xl font-bold text-foreground">Something went wrong</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        An unexpected error interrupted this page. Please try again — if the problem
        persists, contact your church administrator.
      </p>
      <button
        onClick={reset}
        className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
      >
        Try again
      </button>
    </div>
  );
}
