import fs from "fs";
import path from "path";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fileName = searchParams.get("fileName");

    if (!fileName) {
      return NextResponse.json(
        { error: "No file name provided" },
        { status: 400 }
      );
    }

    // Security: prevent path traversal
    if (fileName.includes("..") || fileName.includes("/")) {
      return NextResponse.json({ error: "Invalid file name" }, { status: 400 });
    }

    // Check both drafts and published folders
    const draftPath = path.join(
      process.cwd(),
      "public",
      "images",
      "drafts",
      fileName
    );
    const publishedPath = path.join(
      process.cwd(),
      "public",
      "images",
      fileName
    );

    if (fs.existsSync(draftPath)) {
      fs.unlinkSync(draftPath);
    } else if (fs.existsSync(publishedPath)) {
      fs.unlinkSync(publishedPath);
    } else {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete image" },
      { status: 500 }
    );
  }
}
