import { ScanProgress } from "./scanner";

export type ScanStatus = {
  status: "idle" | "scanning" | "done" | "error";
  progress: ScanProgress | null;
  error: string | null;
  startedAt: number | null;
  finishedAt: number | null;
};

// Module-level state survives across requests in the long-running `next dev`/
// `next start` process (this app is single-user, single-process, localhost only).
const scans = new Map<number, ScanStatus>();

export function getScanStatus(rootId: number): ScanStatus {
  return scans.get(rootId) ?? { status: "idle", progress: null, error: null, startedAt: null, finishedAt: null };
}

export function setScanStatus(rootId: number, status: ScanStatus) {
  scans.set(rootId, status);
}
