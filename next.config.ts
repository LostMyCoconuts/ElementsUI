import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["better-sqlite3"],
  // Pins the workspace root to this checkout. Without this, Turbopack walks
  // up looking for lockfiles and can land on a sibling git worktree's lockfile
  // when multiple worktrees of this repo exist side by side, mixing up module
  // resolution between them.
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
