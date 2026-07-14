import { NextRequest, NextResponse } from "next/server";
import { getDb, ElementRow } from "@/lib/db";

const EDITABLE_FIELDS = [
  "user_title",
  "user_category",
  "user_notes",
  "user_rating",
  "is_favorite",
] as const;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = getDb();
  const element = db.prepare(`SELECT * FROM elements WHERE id = ?`).get(Number(id)) as ElementRow | undefined;
  if (!element) return NextResponse.json({ error: "not found" }, { status: 404 });

  const tags = db
    .prepare(`SELECT t.name FROM tags t JOIN element_tags et ON et.tag_id = t.id WHERE et.element_id = ?`)
    .all(element.id) as { name: string }[];

  return NextResponse.json({
    element: { ...element, formats: JSON.parse(element.formats), tags: tags.map((t) => t.name) },
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const db = getDb();

  const element = db.prepare(`SELECT id FROM elements WHERE id = ?`).get(Number(id));
  if (!element) return NextResponse.json({ error: "not found" }, { status: 404 });

  const updates: string[] = [];
  const args: (string | number | null)[] = [];
  for (const field of EDITABLE_FIELDS) {
    if (field in body) {
      updates.push(`${field} = ?`);
      args.push(body[field]);
    }
  }

  if (updates.length > 0) {
    args.push(Number(id));
    db.prepare(`UPDATE elements SET ${updates.join(", ")} WHERE id = ?`).run(...args);
  }

  const updated = db.prepare(`SELECT * FROM elements WHERE id = ?`).get(Number(id)) as ElementRow;
  return NextResponse.json({ element: { ...updated, formats: JSON.parse(updated.formats) } });
}
