import { afterEach, beforeEach, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  cleanup: undefined as (() => void) | undefined,
}));
vi.mock("react", () => ({
  useRef: (current: unknown) => ({ current }),
  useEffect: (effect: () => () => void) => {
    mocks.cleanup = effect();
  },
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: mocks.push }) }));
vi.mock("cuelume", () => ({ play: vi.fn() }));

beforeEach(() => {
  vi.resetModules();
  mocks.push.mockReset();
  vi.stubGlobal("window", new EventTarget());
  vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => {
  mocks.cleanup?.();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});
const clickDice = () => window.dispatchEvent(new Event("random-dice-click"));

it.each([
  [
    "HTTP failure",
    () => Response.json({ error: "unavailable" }, { status: 503 }),
  ],
  ["invalid JSON", () => new Response("not JSON")],
  ["missing slugs", () => Response.json({ error: "unavailable" })],
  ["invalid slug values", () => Response.json({ slugs: [null] })],
])(
  "retries after %s instead of retaining a poisoned cached response",
  async (_name, failedResponse) => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(failedResponse())
      .mockResolvedValueOnce(Response.json({ slugs: ["jazz"] }));
    vi.stubGlobal("fetch", fetcher);
    const { useRandomPost } = await import("@/components/layout/useRandomPost");
    useRandomPost();
    clickDice();
    await vi.waitFor(() => expect(console.error).toHaveBeenCalledOnce());
    expect(mocks.push).not.toHaveBeenCalled();
    clickDice();
    await vi.waitFor(() =>
      expect(mocks.push).toHaveBeenCalledWith("/posts/jazz")
    );
    expect(fetcher).toHaveBeenCalledTimes(2);
  }
);

it("ignores overlapping presses and reuses a successful slug list", async () => {
  let resolve!: (response: Response) => void;
  const fetcher = vi.fn().mockReturnValue(
    new Promise<Response>((done) => {
      resolve = done;
    })
  );
  vi.stubGlobal("fetch", fetcher);
  const { useRandomPost } = await import("@/components/layout/useRandomPost");
  useRandomPost();
  clickDice();
  clickDice();
  expect(fetcher).toHaveBeenCalledOnce();
  resolve(Response.json({ slugs: ["jazz"] }));
  await vi.waitFor(() => expect(mocks.push).toHaveBeenCalledOnce());
  clickDice();
  await vi.waitFor(() => expect(mocks.push).toHaveBeenCalledTimes(2));
  expect(fetcher).toHaveBeenCalledOnce();
  expect(console.error).not.toHaveBeenCalled();
});
