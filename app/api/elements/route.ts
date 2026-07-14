import { NextRequest, NextResponse } from "next/server";
import { getDb, ElementRow } from "@/lib/db";
import { fuzzyFilter } from "@/lib/search";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const q = sp.get("q") ?? "";
  const rootId = sp.get("rootId");
  const packName = sp.get("packName");
  const dirPath = sp.get("dirPath"); // folder and everything nested beneath it
  const category = sp.get("category");
  const favoritesOnly = sp.get("favoritesOnly") === "1";
  const hasPreviewOnly = sp.get("hasPreviewOnly") === "1";
  const includeMissing = sp.get("includeMissing") === "1";
  const limit = Math.min(Number(sp.get("limit") ?? 500), 2000);
  const offset = Number(sp.get("offset") ?? 0);

  const db = getDb();
  const clauses: string[] = [];
  const args: (string | number)[] = [];

  if (rootId) {
    clauses.push("e.root_id = ?");
    args.push(Number(rootId));
  }
  if (packName) {
    clauses.push("e.pack_name = ?");
    args.push(packName);
  }
  if (dirPath !== null) {
    // Recursive: include elements directly in this folder plus everything in
    // subfolders, so folders that only contain subfolders aren't dead ends
    // in the list view. Escape LIKE wildcards so folder names containing
    // "%" or "_" don't cause spurious matches.
    const escaped = dirPath.replace(/[%_\\]/g, "\\$&");
    clauses.push("(e.dir_path = ? OR e.dir_path LIKE ? ESCAPE '\\')");
    args.push(dirPath, `${escaped}/%`);
  }
  if (category) {
    clauses.push("e.user_category = ?");
    args.push(category);
  }
  if (favoritesOnly) {
    clauses.push("e.is_favorite = 1");
  }
  if (hasPreviewOnly) {
    clauses.push("(e.preview_video_rel_path IS NOT NULL OR e.preview_image_rel_path IS NOT NULL)");
  }
  if (!includeMissing) {
    clauses.push("e.missing = 0");
  }

  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";

  // Fuzzy text search needs the candidate set in memory; SQL filters narrow it
  // down first so Fuse.js only ever ranks the relevant subset, not the whole library.
  const rows = db
    .prepare(`SELECT e.* FROM elements e ${where} ORDER BY e.pack_name, e.display_name`)
    .all(...args) as ElementRow[];

  const filtered = fuzzyFilter(rows, q);
  const total = filtered.length;
  const page = filtered.slice(offset, offset + limit);

  const tagStmt = db.prepare(
    `SELECT t.name FROM tags t JOIN element_tags et ON et.tag_id = t.id WHERE et.element_id = ?`
  );
  const withTags = page.map((row) => ({
    ...row,
    formats: JSON.parse(row.formats),
    tags: (tagStmt.all(row.id) as { name: string }[]).map((t) => t.name),
  }));

  return NextResponse.json({ total, elements: withTags });
}
