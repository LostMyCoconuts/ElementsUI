import { NextRequest, NextResponse } from "next/server";
import { browse } from "@/lib/fsBrowse";

export async function GET(req: NextRequest) {
  const dir = req.nextUrl.searchParams.get("dir");
  const result = browse(dir);
  return NextResponse.json(result);
}
