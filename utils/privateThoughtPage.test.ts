import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { sessionToken } from "./adminAuth";
const state = vi.hoisted((): { token: string | undefined } => ({
  token: undefined,
}));
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: () => (state.token ? { value: state.token } : undefined),
  }),
}));
vi.mock("next/navigation", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/navigation")>()),
  redirect: (location: string) => {
    throw new Error(`redirect:${location}`);
  },
}));
import PrivateTweetPage from "@/app/(sidebar)/tweet/page";
const secret = "test-owner-password";
beforeEach(() => {
  vi.stubEnv("NODE_ENV", "production");
  vi.stubEnv("ADMIN_SECRET", secret);
  state.token = undefined;
});
afterEach(() => vi.unstubAllEnvs());
it("sends visitors to sign-in instead of rendering the private form", async () => {
  await expect(PrivateTweetPage()).rejects.toThrow(
    "redirect:/admin/login?next=%2Ftweet"
  );
});
it("rejects expired sessions before rendering the private form", async () => {
  state.token = sessionToken(secret, 0);
  await expect(PrivateTweetPage()).rejects.toThrow(
    "redirect:/admin/login?next=%2Ftweet"
  );
});
it("renders the private form for an authenticated owner", async () => {
  state.token = sessionToken(secret);
  expect((await PrivateTweetPage()).type).toBe("section");
});
