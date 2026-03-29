import { put } from "@vercel/blob";
import { NextResponse } from "next/server";

// POST /api/gtp/photo — upload a base64 photo, returns a proxy URL for browser access
export async function POST(req: Request) {
  try {
    const { photo, episodeId, round, index } = await req.json();
    if (!photo || typeof photo !== "string") {
      return NextResponse.json({ error: "No photo data" }, { status: 400 });
    }

    // Convert base64 data URL to buffer
    const base64Data = photo.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");
    const ext = photo.startsWith("data:image/png") ? "png" : "jpg";
    const filename = `gtp/photos/ep${episodeId || "0"}_r${round || "0"}_${index || Date.now()}.${ext}`;

    const blob = await put(filename, buffer, {
      access: "private",
      contentType: ext === "png" ? "image/png" : "image/jpeg",
    });

    // Return a proxy URL that serves the private blob through our API
    const proxyUrl = `/api/gtp/img?url=${encodeURIComponent(blob.url)}`;

    return NextResponse.json({ url: proxyUrl });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Upload failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
