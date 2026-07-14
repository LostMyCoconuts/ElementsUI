"use client";

export type Filters = {
  q: string;
  category: string;
  favoritesOnly: boolean;
  hasPreviewOnly: boolean;
};

export default function FilterBar({
  filters,
  onChange,
  resultCount,
}: {
  filters: Filters;
  onChange: (f: Filters) => void;
  resultCount: number;
}) {
  return (
    <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
      <input
        autoFocus
        value={filters.q}
        onChange={(e) => onChange({ ...filters, q: e.target.value })}
        placeholder="Search name, pack, category…"
        className="flex-1 bg-bg-panel-raised border border-border rounded px-3 py-1.5 text-sm text-text placeholder:text-text-faint focus:outline-none focus:border-accent-blue"
      />
      <input
        value={filters.category}
        onChange={(e) => onChange({ ...filters, category: e.target.value })}
        placeholder="Category"
        className="w-32 bg-bg-panel-raised border border-border rounded px-2 py-1.5 text-sm text-text placeholder:text-text-faint focus:outline-none focus:border-accent-blue"
      />
      <button
        onClick={() => onChange({ ...filters, hasPreviewOnly: !filters.hasPreviewOnly })}
        className={`px-3 py-1.5 rounded text-sm border ${
          filters.hasPreviewOnly
            ? "border-accent-blue text-accent-blue-light bg-accent-blue/10"
            : "border-border text-text-dim hover:text-text"
        }`}
      >
        Has preview
      </button>
      <button
        onClick={() => onChange({ ...filters, favoritesOnly: !filters.favoritesOnly })}
        className={`px-3 py-1.5 rounded text-sm border ${
          filters.favoritesOnly
            ? "border-accent-amber text-accent-amber bg-accent-amber/10"
            : "border-border text-text-dim hover:text-text"
        }`}
      >
        ★ Favorites
      </button>
      <span className="text-xs text-text-faint whitespace-nowrap ml-1">{resultCount} results</span>
    </div>
  );
}
