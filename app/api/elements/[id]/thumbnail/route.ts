import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import { getDb } from "@/lib/db";
import { getPreviewImageMimeType } from "@/lib/mime";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = getDb();
  const element = db
    .prepare(
      `SELECT e.preview_image_rel_path, r.path as root_path
       FROM elements e JOIN roots r ON r.id = e.root_id WHERE e.id = ?`
    )
    .get(Number(id)) as { preview_image_rel_path: string | null; root_path: string } | undefined;

  if (!element || !element.preview_image_rel_path) {
    return NextResponse.json({ error: "no preview image for this element" }, { status: 404 });
  }

  const absPath = path.join(element.root_path, element.preview_image_rel_path);
  if (!fs.existsSync(absPath)) {
    return NextResponse.json({ error: "preview file missing on disk" }, { status: 410 });
  }

  const stat = fs.statSync(absPath);
  const mime = getPreviewImageMimeType(path.extname(absPath));
  const stream = fs.readFileSync(absPath);

  return new NextResponse(stream, {
    status: 200,
    headers: {
      "Content-Type": mime,
      "Content-Length": String(stat.size),
      "Cache-Control": "private, max-age=3600",
    },
  });
}
