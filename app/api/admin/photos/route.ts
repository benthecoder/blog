import { NextRequest, NextResponse } from "next/server";
import { checkAdminAuth } from "@/utils/adminAuth";
import { getPhotosForDate, isValidDate } from "@/utils/photos";

// The PhotoKit helper only exists on the local machine.
export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const authError = checkAdminAuth(request);
  if (authError) return authError;

  const date = request.nextUrl.searchParams.get("date");
  if (!isValidDate(date)) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }

  try {
    const result = await getPhotosForDate(date);
    if (!result.ok) {
      return NextResponse.json({ status: result.reason, photos: [] });
    }
    return NextResponse.json({ status: "ok", photos: result.photos });
  } catch (error) {
    console.error("Photos list error:", error);
    return NextResponse.json(
      { error: "Failed to list photos" },
      { status: 500 }
    );
  }
}
