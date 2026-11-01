/** Keep the post-login destination on this origin, including encoded paths. */
export function loginDestination(raw: string | null): string {
  if (!raw?.startsWith("/")) return "/admin";
  const base = "https://local.invalid";
  try {
    const target = new URL(raw, base);
    return target.origin === base
      ? `${target.pathname}${target.search}${target.hash}`
      : "/admin";
  } catch {
    return "/admin";
  }
}
