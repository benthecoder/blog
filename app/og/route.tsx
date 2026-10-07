import { readFile } from "node:fs/promises";
import { OG_FONT_PATH } from "@/config/paths";
import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

// One file read per warm process, shared by concurrent image requests.
// Retry on failure rather than retaining a rejected promise indefinitely.
let fontPromise: Promise<Buffer> | undefined;
function getFont() {
  return (fontPromise ??= readFile(OG_FONT_PATH).catch((error) => {
    fontPromise = undefined;
    throw error;
  }));
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const postTitle = searchParams.get("title");

  // Satori (ImageResponse) can't read woff2, so this route keeps its own
  // TTF copy; it renders server-side only and never ships to browsers.
  const fontData = await getFont();

  const imageResponse = new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          backgroundImage: "url(https://bneo.xyz/og-bg.jpg)",
          fontFamily: '"Averia Serif Libre", serif',
        }}
      >
        <div
          style={{
            marginLeft: 190,
            marginRight: 190,
            display: "flex",
            fontSize: 130,
            letterSpacing: "-0.05em",
            fontStyle: "normal",
            color: "black",
            lineHeight: "120px",
            whiteSpace: "pre-wrap",
          }}
        >
          {postTitle}
        </div>
      </div>
    ),
    {
      width: 1920,
      height: 1080,
      fonts: [
        {
          name: "Averia Serif Libre",
          data: fontData,
          style: "normal",
        },
      ],
    }
  );

  // Finish rendering before returning cacheable success headers. A failed
  // render must remain a server error, rather than a partially streamed 200.
  return new Response(await imageResponse.arrayBuffer(), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=31536000, immutable",
      "Vercel-CDN-Cache-Control":
        "max-age=86400, stale-while-revalidate=604800",
    },
  });
}
