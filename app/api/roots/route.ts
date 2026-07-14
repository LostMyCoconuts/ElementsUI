import { NextRequest, NextResponse } from "next/server";
import path from "node:path";
import fs from "node:fs";
import { getDb, RootRow } from "@/lib/db";

export async function GET() {
  const db = getDb();
  const roots = db.prepare(`SELECT * FROM roots ORDER BY name`).all() as RootRow[];
  return NextResponse.json({ roots });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const rootPath: string | undefined = body?.path;
  if (!rootPath || typeof rootPath !== "string") {
    return NextResponse.json({ error: "path is required" }, { status: 400 });
  }

  let resolved: string;
  try {
    resolved = path.resolve(rootPath);
  } catch {
    return NextResponse.json({ error: "invalid path" }, { status: 400 });
  }

  if (!fs.existsSync(resolved) || !fs.statSync(resolved).isDirectory()) {
    return NextResponse.json({ error: "path does not exist or is not a directory" }, { status: 400 });
  }

  const name: string = body?.name?.trim() || path.basename(resolved) || resolved;
  const db = getDb();

  try {
    const info = db
      .prepare(`INSERT INTO roots (path, name, added_at) VALUES (?, ?, ?)`)
      .run(resolved, name, Date.now());
    const root = db.prepare(`SELECT * FROM roots WHERE id = ?`).get(info.lastInsertRowid) as RootRow;
    return NextResponse.json({ root }, { status: 201 });
  } catch (err: unknown) {
    if (err instanceof Error && err.message.includes("UNIQUE")) {
      return NextResponse.json({ error: "This folder is already a configured library" }, { status: 409 });
    }
    throw err;
  }
}
