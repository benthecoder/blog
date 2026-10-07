import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { OG_FONT_PATH } from "@/config/paths";

const mocks = vi.hoisted(() => ({ readFile: vi.fn(), imageResponse: vi.fn() }));
vi.mock("node:fs/promises", () => ({ readFile: mocks.readFile }));
vi.mock("next/og", () => ({ ImageResponse: mocks.imageResponse }));

beforeEach(() => {
  vi.resetModules();
  mocks.readFile.mockReset();
  mocks.imageResponse.mockReset();
  mocks.imageResponse.mockImplementation(function () {
    return new Response("PNG");
  });
});

const request = () =>
  new NextRequest("https://example.test/og?title=sunday%20links");

describe("social image resource handling", () => {
  it("shares an in-flight font read and reuses it for subsequent requests", async () => {
    let resolveFont!: (value: Buffer) => void;
    mocks.readFile.mockReturnValue(
      new Promise<Buffer>((resolve) => {
        resolveFont = resolve;
      })
    );
    const { GET } = await import("@/app/og/route");
    const requests = Array.from({ length: 10 }, () => GET(request()));
    expect(mocks.readFile).toHaveBeenCalledExactlyOnceWith(OG_FONT_PATH);
    const font = Buffer.from("font");
    resolveFont(font);
    const responses = await Promise.all(requests);
    await GET(request());
    expect(mocks.readFile).toHaveBeenCalledTimes(1);
    expect(
      mocks.imageResponse.mock.calls.every(
        ([, options]) => options.fonts[0].data === font
      )
    ).toBe(true);
    for (const response of responses) {
      expect(await response.text()).toBe("PNG");
      expect(response.headers.get("content-type")).toBe("image/png");
      expect(response.headers.get("cache-control")).toBe(
        "public, max-age=31536000, immutable"
      );
      expect(response.headers.get("vercel-cdn-cache-control")).toBe(
        "max-age=86400, stale-while-revalidate=604800"
      );
    }
  });

  it("retries a failed font read", async () => {
    mocks.readFile
      .mockRejectedValueOnce(new Error("temporary read error"))
      .mockResolvedValue(Buffer.from("font"));
    const { GET } = await import("@/app/og/route");
    await expect(GET(request())).rejects.toThrow("temporary read error");
    expect(mocks.imageResponse).not.toHaveBeenCalled();
    expect((await GET(request())).status).toBe(200);
    expect(mocks.readFile).toHaveBeenCalledTimes(2);
  });

  it("does not return a cacheable success when rendering fails", async () => {
    mocks.readFile.mockResolvedValue(Buffer.from("font"));
    mocks.imageResponse.mockImplementation(function () {
      return new Response(
        new ReadableStream({
          start(controller) {
            controller.error(new Error("render failed"));
          },
        })
      );
    });
    const { GET } = await import("@/app/og/route");
    await expect(GET(request())).rejects.toThrow("render failed");
  });
});
