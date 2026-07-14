"use client";

import { useEffect, useState } from "react";

type BrowseResult = {
  current: string;
  parent: string | null;
  entries: { name: string; path: string; isDir: boolean }[];
  drives?: string[];
};

export default function FolderBrowseModal({
  onClose,
  onSelect,
}: {
  onClose: () => void;
  onSelect: (path: string) => void;
}) {
  const [data, setData] = useState<BrowseResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load(dir: string | null) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/fs${dir ? `?dir=${encodeURIComponent(dir)}` : ""}`);
      if (!res.ok) throw new Error("Failed to browse");
      const json = (await res.json()) as BrowseResult;
      setData(json);
    } catch {
      setError("Couldn't read that folder.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // Fetches the initial directory listing from the server on mount — a
    // data sync with an external system, not derived local state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load(null);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="w-[560px] max-h-[70vh] flex flex-col rounded-lg border border-border bg-bg-panel shadow-2xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <span className="text-sm font-semibold tracking-wide text-text-dim uppercase">
            Choose a library folder
          </span>
          <button onClick={onClose} className="text-text-dim hover:text-text text-lg leading-none px-1">
            ×
          </button>
        </div>

        <div className="px-4 py-2 text-xs text-text-dim font-mono truncate border-b border-border">
          {data?.current ?? "…"}
        </div>

        <div className="flex-1 overflow-y-auto px-2 py-2">
          {loading && <div className="px-2 py-4 text-text-dim text-sm">Loading…</div>}
          {error && <div className="px-2 py-4 text-danger text-sm">{error}</div>}
          {!loading && !error && data && (
            <ul className="text-sm">
              {data.parent && (
                <li>
                  <button
                    onClick={() => load(data.parent)}
                    className="w-full text-left px-2 py-1.5 rounded hover:bg-bg-panel-raised text-text-dim"
                  >
                    .. (up)
                  </button>
                </li>
              )}
              {data.drives?.map((d) => (
                <li key={d}>
                  <button
                    onClick={() => load(d)}
                    className="w-full text-left px-2 py-1.5 rounded hover:bg-bg-panel-raised text-accent-blue-light"
                  >
                    {d}
                  </button>
                </li>
              ))}
              {data.entries.map((e) => (
                <li key={e.path}>
                  <button
                    onClick={() => load(e.path)}
                    className="w-full text-left px-2 py-1.5 rounded hover:bg-bg-panel-raised flex items-center gap-2"
                  >
                    <span className="text-text-faint">📁</span> {e.name}
                  </button>
                </li>
              ))}
              {data.entries.length === 0 && (
                <li className="px-2 py-4 text-text-faint text-sm">No subfolders here.</li>
              )}
            </ul>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-border">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded text-sm text-text-dim hover:text-text"
          >
            Cancel
          </button>
          <button
            onClick={() => data && onSelect(data.current)}
            disabled={!data}
            className="px-4 py-1.5 rounded text-sm font-medium gradient-card-blue text-white disabled:opacity-50"
          >
            Use this folder
          </button>
        </div>
      </div>
    </div>
  );
}
