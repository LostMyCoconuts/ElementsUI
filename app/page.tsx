"use client";

import { useCallback, useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import FolderBrowseModal from "@/components/FolderBrowseModal";
import FilterBar, { type Filters } from "@/components/FilterBar";
import ResultsList from "@/components/ResultsList";
import DetailPanel from "@/components/DetailPanel";
import type { Element, FolderNode, Root, ScanStatus } from "@/lib/types";

const emptyFilters: Filters = { q: "", category: "", favoritesOnly: false, hasPreviewOnly: false };

export default function Page() {
  const [roots, setRoots] = useState<Root[]>([]);
  const [selectedRootId, setSelectedRootId] = useState<number | null>(null);
  const [folderTree, setFolderTree] = useState<FolderNode[]>([]);
  const [selectedFolderPath, setSelectedFolderPath] = useState<string | null>(null);

  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [elements, setElements] = useState<Element[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const [showBrowseModal, setShowBrowseModal] = useState(false);
  const [scanStatus, setScanStatus] = useState<ScanStatus | null>(null);

  const selectedElement = elements.find((e) => e.id === selectedId) ?? null;

  const loadRoots = useCallback(async () => {
    const res = await fetch("/api/roots");
    const json = await res.json();
    setRoots(json.roots);
  }, []);

  const loadFolderTree = useCallback(async (rootId: number | null) => {
    if (rootId === null) {
      setFolderTree([]);
      return;
    }
    const res = await fetch(`/api/folders?rootId=${rootId}`);
    const json = await res.json();
    setFolderTree(json.tree);
  }, []);

  const loadElements = useCallback(async () => {
    const params = new URLSearchParams();
    if (filters.q) params.set("q", filters.q);
    if (selectedRootId !== null) params.set("rootId", String(selectedRootId));
    if (selectedFolderPath !== null) params.set("dirPath", selectedFolderPath);
    if (filters.category) params.set("category", filters.category);
    if (filters.favoritesOnly) params.set("favoritesOnly", "1");
    if (filters.hasPreviewOnly) params.set("hasPreviewOnly", "1");

    const res = await fetch(`/api/elements?${params.toString()}`);
    const json = await res.json();
    setElements(json.elements);
  }, [filters, selectedRootId, selectedFolderPath]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- data fetch on mount
    loadRoots();
  }, [loadRoots]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- data fetch on root change
    loadFolderTree(selectedRootId);
    setSelectedFolderPath(null);
  }, [selectedRootId, loadFolderTree]);

  useEffect(() => {
    // Refetches from the server whenever filters/root/folder change — this is
    // a data sync with an external system (the API), not derived local state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadElements();
  }, [loadElements]);

  // Poll scan progress while a scan is running for the currently selected root.
  useEffect(() => {
    if (selectedRootId === null) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    async function poll() {
      const res = await fetch(`/api/scan?rootId=${selectedRootId}`);
      const json: ScanStatus = await res.json();
      if (cancelled) return;
      setScanStatus(json);
      if (json.status === "scanning") {
        // Refresh the visible list/tree as elements land, so a large first
        // scan is browsable immediately instead of showing nothing until it ends.
        loadElements();
        loadFolderTree(selectedRootId);
        timer = setTimeout(poll, 1500);
      } else if (json.status === "done") {
        loadElements();
        loadFolderTree(selectedRootId);
      }
    }
    poll();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [selectedRootId, loadElements, loadFolderTree]);

  async function handleAddRoot(path: string) {
    setShowBrowseModal(false);
    const res = await fetch("/api/roots", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path }),
    });
    if (!res.ok) {
      const err = await res.json();
      alert(err.error ?? "Failed to add library");
      return;
    }
    const { root } = await res.json();
    await loadRoots();
    setSelectedRootId(root.id);
    await triggerScan(root.id);
  }

  async function handleDeleteRoot(id: number) {
    await fetch(`/api/roots/${id}`, { method: "DELETE" });
    if (selectedRootId === id) setSelectedRootId(null);
    await loadRoots();
  }

  async function triggerScan(rootId: number) {
    await fetch("/api/scan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rootId }),
    });
    setScanStatus({ status: "scanning", progress: null, error: null, startedAt: Date.now(), finishedAt: null });
  }

  async function patchElement(id: number, patch: Partial<Element>) {
    setElements((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));
    await fetch(`/api/elements/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
  }

  async function toggleFavorite(element: Element) {
    await patchElement(element.id, { is_favorite: element.is_favorite ? 0 : 1 });
  }

  async function addTag(id: number, name: string) {
    await fetch("/api/tags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ elementId: id, name }),
    });
    setElements((prev) => prev.map((e) => (e.id === id ? { ...e, tags: [...e.tags, name] } : e)));
  }

  async function removeTag(id: number, name: string) {
    await fetch(`/api/tags?elementId=${id}&name=${encodeURIComponent(name)}`, { method: "DELETE" });
    setElements((prev) =>
      prev.map((e) => (e.id === id ? { ...e, tags: e.tags.filter((t) => t !== name) } : e))
    );
  }

  async function revealElement(id: number, formatTag?: string) {
    // Source format files can be multiple GB, so ElementsUI never streams
    // them through the browser — this opens Explorer with the file
    // pre-selected so the user can grab it themselves.
    const qs = formatTag ? `?format=${encodeURIComponent(formatTag)}` : "";
    await fetch(`/api/elements/${id}/reveal${qs}`, { method: "POST" });
  }

  function selectAndPlay(element: Element) {
    setSelectedId(element.id);
  }

  // Keyboard nav: arrow keys move selection through the list, matching the
  // sibling app's fast-browsing feel.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      if (["INPUT", "TEXTAREA"].includes(target.tagName)) return;

      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        const idx = elements.findIndex((el) => el.id === selectedId);
        const nextIdx =
          e.key === "ArrowDown" ? Math.min(idx + 1, elements.length - 1) : Math.max(idx - 1, 0);
        const next = elements[nextIdx === -1 ? 0 : nextIdx];
        if (next) setSelectedId(next.id);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [elements, selectedId]);

  return (
    <div className="flex h-screen w-full overflow-hidden text-text">
      <Sidebar
        roots={roots}
        selectedRootId={selectedRootId}
        onSelectRoot={setSelectedRootId}
        folderTree={folderTree}
        selectedFolderPath={selectedFolderPath}
        onSelectFolder={setSelectedFolderPath}
        onAddRoot={() => setShowBrowseModal(true)}
        onDeleteRoot={handleDeleteRoot}
        onScanRoot={triggerScan}
        scanStatus={scanStatus}
      />

      <div className="flex-1 min-w-0 flex flex-col">
        <FilterBar filters={filters} onChange={setFilters} resultCount={elements.length} />
        {scanStatus?.status === "scanning" && (
          <div className="px-4 py-1.5 text-xs text-accent-amber bg-accent-amber/10 border-b border-border">
            Scanning… {scanStatus.progress ? `${scanStatus.progress.scanned} files processed` : "starting"}
          </div>
        )}
        <ResultsList
          elements={elements}
          selectedId={selectedId}
          playingId={selectedId}
          onSelect={selectAndPlay}
          onToggleFavorite={toggleFavorite}
        />
      </div>

      <DetailPanel
        element={selectedElement}
        onPatch={patchElement}
        onAddTag={addTag}
        onRemoveTag={removeTag}
        onReveal={revealElement}
      />

      {showBrowseModal && (
        <FolderBrowseModal onClose={() => setShowBrowseModal(false)} onSelect={handleAddRoot} />
      )}
    </div>
  );
}
