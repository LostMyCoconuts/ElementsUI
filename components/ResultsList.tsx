"use client";

import { List, type RowComponentProps } from "react-window";
import { effectiveTitle, formatLabel, type Element } from "@/lib/types";
import VideoThumb from "./VideoThumb";

const ROW_HEIGHT = 76;
const THUMB_WIDTH = 112;

type RowProps = {
  elements: Element[];
  selectedId: number | null;
  playingId: number | null;
  onSelect: (element: Element) => void;
  onToggleFavorite: (element: Element) => void;
};

function Row({ index, style, elements, selectedId, playingId, onSelect, onToggleFavorite }: RowComponentProps<RowProps>) {
  const element = elements[index];
  const isSelected = element.id === selectedId;
  const isPlaying = element.id === playingId;

  return (
    <div
      style={style}
      onClick={() => onSelect(element)}
      className={`relative flex items-center border-b border-border/60 cursor-pointer text-sm ${
        isSelected ? "bg-accent-blue/15" : "hover:bg-bg-panel-raised"
      }`}
    >
      {/* Metadata: padded to leave room for the fixed-position thumbnail on
          the right, so on overflow it truncates/clips under the thumbnail
          instead of pushing it out of place. */}
      <div
        className="flex items-center gap-3 h-full flex-1 min-w-0 pl-3 overflow-hidden"
        style={{ paddingRight: THUMB_WIDTH + 16 }}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(element);
          }}
          className={`shrink-0 w-4 text-base leading-none ${
            element.is_favorite ? "text-accent-amber" : "text-text-faint hover:text-accent-amber"
          }`}
          title="Toggle favorite"
        >
          {element.is_favorite ? "★" : "☆"}
        </button>

        <span className={`shrink-0 w-4 ${isPlaying ? "text-accent-green" : "text-text-faint"}`}>
          {isPlaying ? "▶" : ""}
        </span>

        <div className="min-w-0 flex-1">
          <div className="truncate font-medium" title={element.base_name}>
            {effectiveTitle(element)}
          </div>
          <div className="flex items-center gap-2 mt-0.5 text-xs text-text-dim overflow-hidden whitespace-nowrap">
            <span className="truncate max-w-[10rem]" title={element.pack_name ?? ""}>
              {element.pack_name ?? "—"}
            </span>
            {element.user_category && (
              <span className="shrink-0 px-1.5 py-0.5 rounded bg-bg-panel-raised border border-border text-text-faint">
                {element.user_category}
              </span>
            )}
            {element.formats.length > 0 && (
              <span className="shrink-0 text-text-faint">
                {element.formats.map((f) => formatLabel(f)).join(" · ")}
              </span>
            )}
            {element.missing === 1 && <span className="shrink-0 text-danger">missing</span>}
          </div>
        </div>
      </div>

      <div
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded overflow-hidden border border-border bg-black shrink-0"
        style={{ width: THUMB_WIDTH, height: THUMB_WIDTH * 0.5625 }}
      >
        <VideoThumb element={element} />
      </div>
    </div>
  );
}

export default function ResultsList({ elements, selectedId, playingId, onSelect, onToggleFavorite }: RowProps) {
  return (
    <div className="flex-1 min-h-0 flex flex-col">
      <div className="flex items-center gap-3 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-text-faint border-b border-border">
        <span className="w-4" />
        <span className="w-4" />
        <span className="flex-1">Name</span>
        <span style={{ width: THUMB_WIDTH }} className="text-center shrink-0">
          Preview
        </span>
      </div>
      <div className="flex-1 min-h-0">
        {elements.length === 0 ? (
          <div className="p-8 text-center text-text-faint text-sm">No elements match your filters.</div>
        ) : (
          <List
            rowComponent={Row}
            rowCount={elements.length}
            rowHeight={ROW_HEIGHT}
            rowProps={{ elements, selectedId, playingId, onSelect, onToggleFavorite }}
            style={{ height: "100%" }}
          />
        )}
      </div>
    </div>
  );
}
