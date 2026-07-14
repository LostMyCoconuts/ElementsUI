import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
  const db = getDb();
  const tags = db.prepare(`SELECT name FROM tags ORDER BY name`).all() as { name: string }[];
  return NextResponse.json({ tags: tags.map((t) => t.name) });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const elementId: number | undefined = body?.elementId;
  const name: string | undefined = body?.name?.trim();
  if (!elementId || !name) {
    return NextResponse.json({ error: "elementId and name are required" }, { status: 400 });
  }

  const db = getDb();
  db.prepare(`INSERT OR IGNORE INTO tags (name) VALUES (?)`).run(name);
  const tag = db.prepare(`SELECT id FROM tags WHERE name = ?`).get(name) as { id: number };
  db.prepare(`INSERT OR IGNORE INTO element_tags (element_id, tag_id) VALUES (?, ?)`).run(elementId, tag.id);

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const elementId = sp.get("elementId");
  const name = sp.get("name");
  if (!elementId || !name) {
    return NextResponse.json({ error: "elementId and name are required" }, { status: 400 });
  }

  const db = getDb();
  db.prepare(
    `DELETE FROM element_tags WHERE element_id = ? AND tag_id = (SELECT id FROM tags WHERE name = ?)`
  ).run(Number(elementId), name);

  return NextResponse.json({ ok: true });
}
