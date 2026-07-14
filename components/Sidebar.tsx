"use client";

import { useState } from "react";
import type { FolderNode, Root, ScanStatus } from "@/lib/types";

function FolderTreeNode({
  node,
  depth,
  selectedPath,
  onSelect,
}: {
  node: FolderNode;
  depth: number;
  selectedPath: string | null;
  onSelect: (path: string) => void;
}) {
  const [open, setOpen] = useState(depth < 1);
  const hasChildren = node.children.length > 0;
  const isSelected = selectedPath === node.path;

  return (
    <div>
      <div
        className={`flex items-center gap-1 px-2 py-1 rounded cursor-pointer text-sm ${
          isSelected ? "bg-accent-blue/20 text-accent-blue-light" : "hover:bg-bg-panel-raised text-text-dim"
        }`}
        style={{ paddingLeft: `${depth * 14 + 8}px` }}
        onClick={() => onSelect(node.path)}
      >
        {hasChildren ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setOpen((o) => !o);
            }}
            className="w-4 text-text-faint select-none"
          >
            {open ? "▾" : "▸"}
          </button>
        ) : (
          <span className="w-4" />
        )}
        <span className="truncate flex-1">{node.name}</span>
        {node.count > 0 && <span className="text-xs text-text-faint">{node.count}</span>}
      </div>
      {hasChildren && open && (
        <div>
          {node.children.map((child) => (
            <FolderTreeNode
              key={child.path}
              node={child}
              depth={depth + 1}
              selectedPath={selectedPath}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function Sidebar({
  roots,
  selectedRootId,
  onSelectRoot,
  folderTree,
  selectedFolderPath,
  onSelectFolder,
  onAddRoot,
  onDeleteRoot,
  onScanRoot,
  scanStatus,
}: {
  roots: Root[];
  selectedRootId: number | null;
  onSelectRoot: (id: number | null) => void;
  folderTree: FolderNode[];
  selectedFolderPath: string | null;
  onSelectFolder: (path: string | null) => void;
  onAddRoot: () => void;
  onDeleteRoot: (id: number) => void;
  onScanRoot: (id: number) => void;
  scanStatus: ScanStatus | null;
}) {
  return (
    <div className="w-72 shrink-0 border-r border-border bg-bg-panel/60 flex flex-col h-full">
      <div className="px-4 py-3 border-b border-border">
        <div className="text-xs font-bold tracking-[0.15em] text-accent-blue-light uppercase">
          ElementsUI
        </div>
      </div>

      <div className="px-3 py-2 flex items-center justify-between">
        <span className="text-xs font-semibold text-text-faint uppercase tracking-wide">Libraries</span>
        <button
          onClick={onAddRoot}
          className="text-xs px-2 py-1 rounded gradient-card-blue text-white font-medium"
        >
          + Add
        </button>
      </div>

      <div className="px-2 pb-2">
        <button
          onClick={() => onSelectRoot(null)}
          className={`w-full text-left px-2 py-1.5 rounded text-sm ${
            selectedRootId === null ? "bg-accent-blue/20 text-accent-blue-light" : "hover:bg-bg-panel-raised text-text-dim"
          }`}
        >
          All libraries
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-2">
        {roots.map((root) => (
          <div key={root.id} className="mb-1">
            <div
              className={`group flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer text-sm ${
                selectedRootId === root.id ? "bg-accent-blue/20 text-accent-blue-light" : "hover:bg-bg-panel-raised text-text"
              }`}
              onClick={() => onSelectRoot(root.id)}
            >
              <span className="truncate flex-1 font-medium">{root.name}</span>
              {scanStatus?.status === "scanning" && selectedRootId === root.id ? (
                <span className="text-xs text-accent-amber">scanning…</span>
              ) : (
                <button
                  title="Rescan"
                  onClick={(e) => {
                    e.stopPropagation();
                    onScanRoot(root.id);
                  }}
                  className="text-xs text-text-faint hover:text-accent-blue-light opacity-0 group-hover:opacity-100"
                >
                  ⟳
                </button>
              )}
              <button
                title="Remove library"
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm(`Remove "${root.name}" from ElementsUI? This won't delete any files.`)) {
                    onDeleteRoot(root.id);
                  }
                }}
                className="text-xs text-text-faint hover:text-danger opacity-0 group-hover:opacity-100"
              >
                ✕
              </button>
            </div>

            {selectedRootId === root.id && folderTree.length > 0 && (
              <div className="mt-0.5 mb-1">
                {folderTree.map((node) => (
                  <FolderTreeNode
                    key={node.path}
                    node={node}
                    depth={0}
                    selectedPath={selectedFolderPath}
                    onSelect={(p) => onSelectFolder(p)}
                  />
                ))}
              </div>
            )}
          </div>
        ))}

        {roots.length === 0 && (
          <div className="px-2 py-6 text-xs text-text-faint">
            No libraries yet. Click &quot;+ Add&quot; to point ElementsUI at a folder of VFX elements.
          </div>
        )}
      </div>
    </div>
  );
}
