import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import path from "node:path";
const OG_FONT_PATH = path.join(
  process.cwd(),
  "app",
  "og",
  "AveriaSerifLibre-Bold.ttf"
);
const OG_BACKGROUND_PATH = path.join(process.cwd(), "app", "og", "og-bg.jpg");

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
  it("shares in-flight asset reads and reuses them for subsequent requests", async () => {
    let resolveFont!: (value: Buffer) => void;
    const pendingFont = new Promise<Buffer>((resolve) => {
      resolveFont = resolve;
    });
    mocks.readFile.mockImplementation((file) =>
      file === OG_FONT_PATH ? pendingFont : Promise.resolve(Buffer.from("jpeg"))
    );
    const { GET } = await import("@/app/og/route");
    const requests = Array.from({ length: 10 }, () => GET(request()));
    expect(mocks.readFile.mock.calls.map(([file]) => file)).toEqual([
      OG_FONT_PATH,
      OG_BACKGROUND_PATH,
    ]);
    const font = Buffer.from("font");
    resolveFont(font);
    const responses = await Promise.all(requests);
    await GET(request());
    expect(mocks.readFile).toHaveBeenCalledTimes(2);
    expect(
      mocks.imageResponse.mock.calls[0][0].props.style.backgroundImage
    ).toBe(
      `url(data:image/jpeg;base64,${Buffer.from("jpeg").toString("base64")})`
    );
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
    expect(mocks.readFile).toHaveBeenCalledTimes(3);
  });

  it("retries a failed background read without rereading the font", async () => {
    let attempts = 0;
    mocks.readFile.mockImplementation(async (file) => {
      if (file === OG_BACKGROUND_PATH && attempts++ === 0)
        throw new Error("background unavailable");
      return Buffer.from("asset");
    });
    const { GET } = await import("@/app/og/route");
    await expect(GET(request())).rejects.toThrow("background unavailable");
    expect(mocks.imageResponse).not.toHaveBeenCalled();
    expect((await GET(request())).status).toBe(200);
    expect(
      mocks.readFile.mock.calls.filter(([file]) => file === OG_FONT_PATH)
    ).toHaveLength(1);
    expect(
      mocks.readFile.mock.calls.filter(([file]) => file === OG_BACKGROUND_PATH)
    ).toHaveLength(2);
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
