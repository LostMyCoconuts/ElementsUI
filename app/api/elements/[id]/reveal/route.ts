import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import { getDb } from "@/lib/db";
import { revealInFileManager } from "@/lib/reveal";
import type { ElementFormat } from "@/lib/types";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const formatTag = req.nextUrl.searchParams.get("format");

  const db = getDb();
  const element = db
    .prepare(
      `SELECT e.formats, e.preview_video_rel_path, e.preview_image_rel_path, r.path as root_path
       FROM elements e JOIN roots r ON r.id = e.root_id WHERE e.id = ?`
    )
    .get(Number(id)) as
    | {
        formats: string;
        preview_video_rel_path: string | null;
        preview_image_rel_path: string | null;
        root_path: string;
      }
    | undefined;

  if (!element) return NextResponse.json({ error: "not found" }, { status: 404 });

  const formats = JSON.parse(element.formats) as ElementFormat[];
  let relPath: string | null = null;

  if (formatTag) {
    relPath = formats.find((f) => f.tag === formatTag)?.rel_path ?? null;
  } else {
    // Default to the highest-resolution format (formats are stored sorted
    // ascending), falling back to whatever preview exists if there are no
    // source format files at all.
    relPath = formats.at(-1)?.rel_path ?? element.preview_video_rel_path ?? element.preview_image_rel_path;
  }

  if (!relPath) return NextResponse.json({ error: "nothing to reveal for this element" }, { status: 404 });

  const absPath = path.join(element.root_path, relPath);
  if (!fs.existsSync(absPath)) {
    return NextResponse.json({ error: "file missing on disk" }, { status: 410 });
  }

  revealInFileManager(absPath);
  return NextResponse.json({ ok: true });
}
