import { expect, test } from "@playwright/test";

/**
 * Auth flow smoke test — register → sign in → dashboard → command palette
 * → sign out. The ⌘K palette section runs authenticated because the palette
 * lives inside the dashboard shell.
 *
 * Uses a unique email per run because the dev backend keeps accounts in
 * memory for the lifetime of the process. The first registered account on a
 * fresh backend automatically receives the SUPER_ADMIN role, so this also
 * exercises the most-privileged path through the UI.
 */
test("auth flow: register, sign in, reach dashboard, sign out", async ({ page }) => {
  const stamp = Date.now();
  const email = `e2e-${stamp}@example.com`;
  const password = "E2e-Smoke-123!";
  const fullName = "E2E Smoke";

  // ── Registration ────────────────────────────────────────────────
  await page.goto("/register");
  await expect(page.getByRole("heading", { name: "Create your account" })).toBeVisible();

  await page.getByLabel("First Name").fill("E2E");
  await page.getByLabel("Last Name").fill("Smoke");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Phone (optional)").fill("0712 345 678");
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByLabel("Confirm Password").fill(password);
  await page.getByLabel(/agree to the Terms of Service and Privacy Policy/i).check();
  await page.getByRole("button", { name: "Create Account" }).click();

  // Success banner appears, then the app redirects to /login.
  await expect(page.getByText(/Account created/i)).toBeVisible();
  await expect(page).toHaveURL(/\/login$/, { timeout: 10_000 });

  // ── Sign in ────────────────────────────────────────────────────
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign In" }).click();

  // Lands on the dashboard (route guard accepts the stored JWT).
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 10_000 });
  await expect(page.getByText(/PCEA/i).first()).toBeVisible();

  // ── Command palette (Ctrl/⌘K) ─────────────────────────────────
  // Opens from the visible header trigger.
  await page.getByRole("button", { name: "Quick search (Ctrl K)" }).click();
  const palette = page.getByRole("dialog", { name: "Quick navigation" });
  await expect(palette).toBeVisible();

  // Search box is focused and typing narrows the results.
  const search = page.getByRole("combobox", { name: "Search pages" });
  await expect(search).toBeFocused();
  await search.fill("Events");
  await expect(palette.getByRole("option", { name: /Events/ })).toBeVisible();
  await expect(palette.getByRole("option", { name: /Give/ })).toHaveCount(0);

  // Picking a result navigates and closes the palette.
  await palette.getByRole("option", { name: /Events/ }).click();
  await expect(page).toHaveURL(/\/events$/, { timeout: 20_000 });
  await expect(palette).toHaveCount(0);

  // Shortcut reopens it; Escape closes it.
  await page.keyboard.press("Control+K");
  await expect(palette).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(palette).toHaveCount(0);

  // ── Sign out ───────────────────────────────────────────────────
  await page.getByRole("button", { name: "Account menu" }).click();
  await page.getByRole("button", { name: /Sign out/i }).click();
  await expect(page).toHaveURL(/\/login$/, { timeout: 10_000 });

  // Guarded route bounces back to /login once signed out.
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login$/, { timeout: 10_000 });
});
