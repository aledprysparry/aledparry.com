import { put } from "@vercel/blob";
import { NextResponse } from "next/server";

// POST /api/gtp/photo — upload a photo via FormData (binary), returns a proxy URL
export async function POST(req: Request) {
  try {
    const contentType = req.headers.get("content-type") || "";

    let buffer: Buffer;
    let ext = "jpg";
    let episodeId = "0";
    let round = "0";
    let index = String(Date.now());

    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      const file = form.get("photo") as File | null;
      if (!file) return NextResponse.json({ error: "No photo" }, { status: 400 });
      buffer = Buffer.from(await file.arrayBuffer());
      ext = file.type === "image/png" ? "png" : "jpg";
      episodeId = (form.get("episodeId") as string) || "0";
      round = (form.get("round") as string) || "0";
      index = (form.get("index") as string) || String(Date.now());
    } else {
      // Legacy JSON path
      const { photo, episodeId: eid, round: r, index: idx } = await req.json();
      if (!photo || typeof photo !== "string") {
        return NextResponse.json({ error: "No photo data" }, { status: 400 });
      }
      const base64Data = photo.replace(/^data:image\/\w+;base64,/, "");
      buffer = Buffer.from(base64Data, "base64");
      ext = photo.startsWith("data:image/png") ? "png" : "jpg";
      episodeId = eid || "0";
      round = r || "0";
      index = idx || String(Date.now());
    }

    const filename = `gtp/photos/ep${episodeId}_r${round}_${index}.${ext}`;
    const blob = await put(filename, buffer, {
      access: "private",
      contentType: ext === "png" ? "image/png" : "image/jpeg",
      allowOverwrite: true,
    });

    const proxyUrl = `/api/gtp/img?url=${encodeURIComponent(blob.url)}`;
    return NextResponse.json({ url: proxyUrl });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Upload failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
