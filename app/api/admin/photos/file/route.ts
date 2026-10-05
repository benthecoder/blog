import fs from "fs";
import { NextRequest, NextResponse } from "next/server";
import { checkAdminAuth } from "@/utils/adminAuth";
import { ensureFull, isValidPhotoId, thumbPath } from "@/utils/photos";

export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const authError = checkAdminAuth(request);
  if (authError) return authError;

  const id = request.nextUrl.searchParams.get("id");
  const size = request.nextUrl.searchParams.get("size");
  if (!isValidPhotoId(id) || (size !== "thumb" && size !== "full")) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  try {
    // Thumbnails are written when the day list is fetched.
    const file = size === "thumb" ? thumbPath(id) : await ensureFull(id);
    if (!fs.existsSync(file)) {
      return NextResponse.json({ error: "Photo not found" }, { status: 404 });
    }
    return new NextResponse(new Uint8Array(fs.readFileSync(file)), {
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "private, max-age=86400",
      },
    });
  } catch (error) {
    console.error("Photo file error:", error);
    return NextResponse.json(
      { error: "Failed to read photo" },
      { status: 500 }
    );
  }
}
