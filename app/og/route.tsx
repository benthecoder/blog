import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const postTitle = searchParams.get('title');

  // You would fetch the actual font file here. This URL is just an example.
  const fontFileUrl = 'https://example.com/fonts/AveriaSerifLibre-Regular.ttf'; // Replace with the actual URL to your font file
  const fontRes = await fetch(fontFileUrl);
  if (!fontRes.ok) {
    throw new Error(
      `Failed to load the font from ${fontFileUrl}: ${fontRes.status}`
    );
  }
  const fontData = await fontRes.arrayBuffer();

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'center',
          backgroundImage: 'url(https://bneo.xyz/og-bg.png)',
          fontFamily: '"Averia Serif Libre", serif',
        }}
      >
        <div
          style={{
            marginLeft: 190,
            marginRight: 190,
            display: 'flex',
            fontSize: 130,
            letterSpacing: '-0.05em',
            fontStyle: 'normal',
            color: 'black',
            lineHeight: '120px',
            whiteSpace: 'pre-wrap',
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
          name: 'Averia Serif Libre',
          data: fontData, // fontData is now an ArrayBuffer
          style: 'normal',
          weight: 400, // Assuming 400 is a valid value for the Weight type
        },
      ],
    }
  );
}
