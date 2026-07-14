import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export type FolderNode = {
  name: string;
  path: string; // dir_path value used to filter elements for this folder (and its subfolders)
  count: number; // total element count contained in this folder, including all subfolders
  children: FolderNode[];
};

// Rebuilds the folder tree from the distinct dir_path values already indexed
// in SQLite, so browsing the library never re-touches the filesystem.
function buildTree(rows: { dir_path: string; count: number }[]): FolderNode[] {
  const root: FolderNode = { name: "", path: "", count: 0, children: [] };
  const nodeByPath = new Map<string, FolderNode>([["", root]]);
  const directCount = new Map<string, number>();

  for (const row of rows) {
    directCount.set(row.dir_path, row.count);
    if (row.dir_path === "") continue;

    const segments = row.dir_path.split("/");
    let parentPath = "";
    for (let i = 0; i < segments.length; i++) {
      const currentPath = segments.slice(0, i + 1).join("/");
      if (!nodeByPath.has(currentPath)) {
        const node: FolderNode = { name: segments[i], path: currentPath, count: 0, children: [] };
        nodeByPath.set(currentPath, node);
        nodeByPath.get(parentPath)!.children.push(node);
      }
      parentPath = currentPath;
    }
  }

  // Rolls direct counts up so a folder that only contains subfolders (no
  // elements of its own) still shows how many elements live somewhere
  // beneath it, instead of a misleading "0".
  function rollUp(node: FolderNode): number {
    const own = directCount.get(node.path) ?? 0;
    const childTotal = node.children.reduce((sum, child) => sum + rollUp(child), 0);
    node.count = own + childTotal;
    return node.count;
  }
  rollUp(root);

  const sortChildren = (node: FolderNode) => {
    node.children.sort((a, b) => a.name.localeCompare(b.name));
    node.children.forEach(sortChildren);
  };
  sortChildren(root);

  return root.children;
}

export async function GET(req: NextRequest) {
  const rootId = req.nextUrl.searchParams.get("rootId");
  if (!rootId) {
    return NextResponse.json({ error: "rootId is required" }, { status: 400 });
  }

  const db = getDb();
  const rows = db
    .prepare(
      `SELECT dir_path, COUNT(*) as count FROM elements WHERE root_id = ? AND missing = 0 GROUP BY dir_path`
    )
    .all(Number(rootId)) as { dir_path: string; count: number }[];

  return NextResponse.json({ tree: buildTree(rows) });
}
