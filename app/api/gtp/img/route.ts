import { get } from "@vercel/blob";
import { NextResponse } from "next/server";

// GET /api/gtp/img?url=<blob-url> — proxy private blob images for browser access
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const blobUrl = searchParams.get("url");
    if (!blobUrl) {
      return new NextResponse("Missing url param", { status: 400 });
    }

    const result = await get(blobUrl, { access: "private" });
    if (!result || result.statusCode !== 200) {
      return new NextResponse("Not found", { status: 404 });
    }

    const headers = new Headers();
    headers.set("Content-Type", result.blob.contentType || "image/jpeg");
    headers.set("Cache-Control", "public, max-age=31536000, immutable");

    return new NextResponse(result.stream, { headers });
  } catch {
    return new NextResponse("Failed to load image", { status: 500 });
  }
}
