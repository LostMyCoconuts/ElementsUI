// Client-safe types (no better-sqlite3 import) shared between API responses and UI.

export type Root = {
  id: number;
  path: string;
  name: string;
  added_at: number;
  last_scan_at: number | null;
};

// A source-resolution/format variant of an element (e.g. the "4K" .mov, or
// the "6K" .exr sequence master). Never served over HTTP — these files can be
// multiple GB — only listed so the user knows what's available and can reveal
// it in Explorer to grab the real file themselves.
export type ElementFormat = {
  tag: string; // e.g. "2K", "4K", "6K", "RAW16" — the trailing filename token
  ext: string; // lowercase, no dot, e.g. "mov", "exr"
  rel_path: string;
  file_size: number | null;
};

// Extensions common enough in VFX delivery that calling them out per-format
// would just be noise (see formatLabel below).
const COMMON_FORMAT_EXTS = new Set(["mov", "mp4"]);

export function formatLabel(f: ElementFormat): string {
  return COMMON_FORMAT_EXTS.has(f.ext.toLowerCase()) ? f.tag : `${f.tag} (${f.ext.toUpperCase()})`;
}

export type Element = {
  id: number;
  root_id: number;
  pack_name: string | null;
  dir_path: string;
  base_name: string;
  display_name: string;

  formats: ElementFormat[];
  preview_video_rel_path: string | null;
  preview_video_file_size: number | null;
  preview_image_rel_path: string | null;
  preview_image_file_size: number | null;

  file_mtime: number;
  indexed_at: number;

  // user-editable overlay, stored only here, source assets are never touched
  user_title: string | null;
  user_category: string | null;
  user_notes: string | null;
  user_rating: number | null;
  is_favorite: number;

  missing: number;
  tags: string[];
};

export function effectiveTitle(e: Element): string {
  return e.user_title || e.display_name;
}

export function hasPreview(e: Element): boolean {
  return e.preview_video_rel_path !== null || e.preview_image_rel_path !== null;
}

export type FolderNode = {
  name: string;
  path: string;
  count: number;
  children: FolderNode[];
};

export type ScanProgress = {
  scanned: number;
  added: number;
  updated: number;
  unchanged: number;
  missing: number;
  errors: number;
};

export type ScanStatus = {
  status: "idle" | "scanning" | "done" | "error";
  progress: ScanProgress | null;
  error: string | null;
  startedAt: number | null;
  finishedAt: number | null;
};
