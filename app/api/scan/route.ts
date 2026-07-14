import { NextRequest, NextResponse } from "next/server";
import { getDb, RootRow } from "@/lib/db";
import { scanRoot } from "@/lib/scanner";
import { getScanStatus, setScanStatus } from "@/lib/scanState";

export async function GET(req: NextRequest) {
  const rootIdParam = req.nextUrl.searchParams.get("rootId");
  if (!rootIdParam) {
    return NextResponse.json({ error: "rootId is required" }, { status: 400 });
  }
  return NextResponse.json(getScanStatus(Number(rootIdParam)));
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const rootId: number | undefined = body?.rootId;
  if (!rootId) {
    return NextResponse.json({ error: "rootId is required" }, { status: 400 });
  }

  const db = getDb();
  const root = db.prepare(`SELECT * FROM roots WHERE id = ?`).get(rootId) as RootRow | undefined;
  if (!root) {
    return NextResponse.json({ error: "root not found" }, { status: 404 });
  }

  const existing = getScanStatus(rootId);
  if (existing.status === "scanning") {
    return NextResponse.json({ error: "scan already in progress" }, { status: 409 });
  }

  setScanStatus(rootId, {
    status: "scanning",
    progress: null,
    error: null,
    startedAt: Date.now(),
    finishedAt: null,
  });

  // Runs in the background; the response returns immediately and the UI
  // polls GET /api/scan?rootId= for progress. Safe here because this is a
  // long-running local Node process (next dev/start), not a serverless function.
  scanRoot(root, (progress) => {
    setScanStatus(rootId, {
      status: "scanning",
      progress,
      error: null,
      startedAt: existing.startedAt ?? Date.now(),
      finishedAt: null,
    });
  })
    .then((finalProgress) => {
      setScanStatus(rootId, {
        status: "done",
        progress: finalProgress,
        error: null,
        startedAt: existing.startedAt ?? Date.now(),
        finishedAt: Date.now(),
      });
    })
    .catch((err) => {
      setScanStatus(rootId, {
        status: "error",
        progress: null,
        error: err instanceof Error ? err.message : String(err),
        startedAt: existing.startedAt ?? Date.now(),
        finishedAt: Date.now(),
      });
    });

  return NextResponse.json({ started: true });
}
