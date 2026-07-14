import Fuse from "fuse.js";
import { ElementRow } from "./db";

export function fuzzyFilter(rows: ElementRow[], query: string): ElementRow[] {
  if (!query.trim()) return rows;

  const fuse = new Fuse(rows, {
    keys: [
      { name: "display_name", weight: 2 },
      { name: "base_name", weight: 1.5 },
      { name: "pack_name", weight: 1.5 },
      { name: "dir_path", weight: 1 },
      { name: "user_title", weight: 1.5 },
      { name: "user_category", weight: 1 },
    ],
    threshold: 0.35,
    ignoreLocation: true,
  });

  return fuse.search(query).map((r) => r.item);
}
