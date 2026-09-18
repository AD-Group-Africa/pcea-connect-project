// Guard for `npm run dev`: fails fast with a clear message when another dev
// server already owns this project (Next.js holds .next/dev/lock and a second
// instance exits silently), and cleans up the lock when the owning process is
// gone. Wired as the `predev` script so `npm run dev` always runs it first.
import { readFileSync, unlinkSync, existsSync } from "node:fs";
import { join } from "node:path";

const lockPath = join(process.cwd(), ".next", "dev", "lock");
if (!existsSync(lockPath)) process.exit(0);

let lock = null;
try { lock = JSON.parse(readFileSync(lockPath, "utf8")); } catch { lock = null; }

const pid = lock?.pid;
let alive = false;
if (pid) {
  try { process.kill(pid, 0); alive = true; } catch (e) { alive = e.code === "EPERM"; }
}

if (alive) {
  console.error(
    `\n[dev] A Next.js dev server for this project is ALREADY RUNNING` +
      `${lock?.appUrl ? ` at ${lock.appUrl}` : ""} (pid ${pid}).\n` +
      `      Reusing it, or stop it first:\n` +
      `        Windows:  taskkill /PID ${pid} /F\n` +
      `        macOS/Linux: kill ${pid}\n`
  );
  process.exit(1);
}

// Stale lock from a dead process — safe to remove so the new server can start.
try { unlinkSync(lockPath); } catch { /* raced away */ }
console.log("[dev] Removed stale Next.js dev lock (previous server is gone). Starting fresh.");
process.exit(0);
