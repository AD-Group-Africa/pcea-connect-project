export function getJwtPayload(): Record<string, unknown> | null {
  if (typeof window === "undefined") return null
  const token = localStorage.getItem("token")
  if (!token) return null
  try {
    return JSON.parse(atob(token.split(".")[1])) as Record<string, unknown>
  } catch {
    return null
  }
}

export function getUserId(): string | null {
  const payload = getJwtPayload()
  const sub = payload?.sub
  return typeof sub === "string" ? sub : null
}

/** Roles embedded in the JWT (e.g. "MEMBER", "SUNDAY_SCHOOL_TEACHER"). */
export function getRoles(): string[] {
  const payload = getJwtPayload()
  const roles = payload?.roles || payload?.authorities || []
  return Array.isArray(roles)
    ? roles.map((r) => String(r).replace(/^ROLE_/, ""))
    : []
}

/** Turn an enum-ish role into readable text for display. */
export function humanizeRole(role: string): string {
  return role
    .toLowerCase()
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ")
}
