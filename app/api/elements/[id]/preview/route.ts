import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";
import { getDb } from "@/lib/db";
import { getPreviewVideoMimeType } from "@/lib/mime";

// Streams the low-res preview clip only — never a source format file, which
// can be multiple GB. Range support is required for scrubbing/hover-seek.
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = getDb();
  const element = db
    .prepare(
      `SELECT e.preview_video_rel_path, r.path as root_path
       FROM elements e JOIN roots r ON r.id = e.root_id WHERE e.id = ?`
    )
    .get(Number(id)) as { preview_video_rel_path: string | null; root_path: string } | undefined;

  if (!element || !element.preview_video_rel_path) {
    return NextResponse.json({ error: "no preview video for this element" }, { status: 404 });
  }

  const absPath = path.join(element.root_path, element.preview_video_rel_path);
  if (!fs.existsSync(absPath)) {
    return NextResponse.json({ error: "preview file missing on disk" }, { status: 410 });
  }

  const stat = fs.statSync(absPath);
  const mime = getPreviewVideoMimeType(path.extname(absPath));
  const range = req.headers.get("range");

  const headers: Record<string, string> = {
    "Content-Type": mime,
    "Accept-Ranges": "bytes",
  };

  if (range) {
    const match = /bytes=(\d+)-(\d*)/.exec(range);
    const start = match ? Number(match[1]) : 0;
    const end = match && match[2] ? Number(match[2]) : stat.size - 1;
    const chunkSize = end - start + 1;

    const stream = Readable.toWeb(fs.createReadStream(absPath, { start, end })) as ReadableStream;
    headers["Content-Range"] = `bytes ${start}-${end}/${stat.size}`;
    headers["Content-Length"] = String(chunkSize);

    return new NextResponse(stream, { status: 206, headers });
  }

  headers["Content-Length"] = String(stat.size);
  const stream = Readable.toWeb(fs.createReadStream(absPath)) as ReadableStream;
  return new NextResponse(stream, { status: 200, headers });
}
