import Database from "better-sqlite3";
import path from "node:path";
import fs from "node:fs";

const DB_DIR = path.join(process.cwd(), ".data");
const DB_PATH = path.join(DB_DIR, "library.sqlite3");

function createSchema(db: Database.Database) {
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  db.exec(`
    CREATE TABLE IF NOT EXISTS roots (
      id          INTEGER PRIMARY KEY,
      path        TEXT UNIQUE NOT NULL,
      name        TEXT NOT NULL,
      added_at    INTEGER NOT NULL,
      last_scan_at INTEGER
    );

    CREATE TABLE IF NOT EXISTS elements (
      id            INTEGER PRIMARY KEY,
      root_id       INTEGER NOT NULL REFERENCES roots(id) ON DELETE CASCADE,
      pack_name     TEXT,                   -- collection folder (top-level under root)
      dir_path      TEXT NOT NULL,          -- relative dir of the representative source file
      base_name     TEXT NOT NULL,          -- shared filename stem before the trailing _2K/_4K/_preview token
      display_name  TEXT NOT NULL,          -- human-friendly version of base_name

      formats       TEXT NOT NULL DEFAULT '[]', -- JSON array of ElementFormat, never served over HTTP
      preview_video_rel_path  TEXT,
      preview_video_file_size INTEGER,
      preview_image_rel_path  TEXT,
      preview_image_file_size INTEGER,

      file_mtime    INTEGER NOT NULL,       -- max mtime across all matched files, for change detection
      indexed_at    INTEGER NOT NULL,

      -- user-editable overlay, stored only here, source assets are never touched
      user_title    TEXT,
      user_category TEXT,
      user_notes    TEXT,
      user_rating   INTEGER,                -- 0-5
      is_favorite   INTEGER NOT NULL DEFAULT 0,

      missing       INTEGER NOT NULL DEFAULT 0, -- set 1 when not found on last rescan

      UNIQUE(root_id, pack_name, base_name)
    );

    CREATE INDEX IF NOT EXISTS idx_elements_root ON elements(root_id);
    CREATE INDEX IF NOT EXISTS idx_elements_pack ON elements(pack_name);
    CREATE INDEX IF NOT EXISTS idx_elements_dir ON elements(root_id, dir_path);
    CREATE INDEX IF NOT EXISTS idx_elements_favorite ON elements(is_favorite);

    CREATE TABLE IF NOT EXISTS tags (
      id    INTEGER PRIMARY KEY,
      name  TEXT UNIQUE NOT NULL
    );

    CREATE TABLE IF NOT EXISTS element_tags (
      element_id INTEGER NOT NULL REFERENCES elements(id) ON DELETE CASCADE,
      tag_id     INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
      PRIMARY KEY (element_id, tag_id)
    );
  `);
}

let dbInstance: Database.Database | null = null;

export function getDb(): Database.Database {
  if (dbInstance) return dbInstance;
  if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });
  const db = new Database(DB_PATH);
  createSchema(db);
  dbInstance = db;
  return db;
}

export type RootRow = {
  id: number;
  path: string;
  name: string;
  added_at: number;
  last_scan_at: number | null;
};

export type ElementRow = {
  id: number;
  root_id: number;
  pack_name: string | null;
  dir_path: string;
  base_name: string;
  display_name: string;
  formats: string; // JSON-encoded ElementFormat[]
  preview_video_rel_path: string | null;
  preview_video_file_size: number | null;
  preview_image_rel_path: string | null;
  preview_image_file_size: number | null;
  file_mtime: number;
  indexed_at: number;
  user_title: string | null;
  user_category: string | null;
  user_notes: string | null;
  user_rating: number | null;
  is_favorite: number;
  missing: number;
};
