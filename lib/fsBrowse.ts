import fs from "node:fs";
import path from "node:path";
import os from "node:os";

export type FsEntry = { name: string; path: string; isDir: boolean };

export type BrowseResult = {
  current: string;
  parent: string | null;
  entries: FsEntry[];
  drives?: string[];
};

function listWindowsDrives(): string[] {
  const drives: string[] = [];
  for (let c = 65; c <= 90; c++) {
    const letter = `${String.fromCharCode(c)}:\\`;
    try {
      fs.accessSync(letter);
      drives.push(letter);
    } catch {
      // drive not present
    }
  }
  return drives;
}

export function browse(dir: string | null): BrowseResult {
  const isWindows = os.platform() === "win32";
  const target = dir && dir.length > 0 ? dir : os.homedir();

  let resolved: string;
  try {
    resolved = path.resolve(target);
  } catch {
    resolved = os.homedir();
  }

  let dirEntries: fs.Dirent[] = [];
  try {
    dirEntries = fs.readdirSync(resolved, { withFileTypes: true });
  } catch {
    dirEntries = [];
  }

  const entries: FsEntry[] = dirEntries
    .filter((e) => e.isDirectory() && !e.name.startsWith("."))
    .map((e) => ({ name: e.name, path: path.join(resolved, e.name), isDir: true }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const parent = path.dirname(resolved);
  const atDriveRoot = isWindows && /^[A-Za-z]:\\$/.test(resolved);

  return {
    current: resolved,
    parent: atDriveRoot || parent === resolved ? null : parent,
    entries,
    drives: isWindows ? listWindowsDrives() : undefined,
  };
}
