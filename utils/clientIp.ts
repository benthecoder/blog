import { createHash } from "crypto";

export function clientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for") || "";
  return (
    forwardedFor.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

export const hashViewer = (value: string) =>
  createHash("sha256").update(value).digest("hex");
