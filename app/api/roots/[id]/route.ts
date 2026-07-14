import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = getDb();
  const info = db.prepare(`DELETE FROM roots WHERE id = ?`).run(Number(id));
  if (info.changes === 0) {
    return NextResponse.json({ error: "root not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
