"use client";

import { useState } from "react";
import { formatLabel, type Element } from "@/lib/types";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block mb-3">
      <span className="block text-xs font-semibold text-text-faint uppercase tracking-wide mb-1">
        {label}
      </span>
      {children}
    </label>
  );
}

const inputClass =
  "w-full bg-bg-panel-raised border border-border rounded px-2 py-1.5 text-sm text-text focus:outline-none focus:border-accent-blue";

type DetailPanelProps = {
  element: Element | null;
  onPatch: (id: number, patch: Partial<Element>) => void;
  onAddTag: (id: number, name: string) => void;
  onRemoveTag: (id: number, name: string) => void;
  onReveal: (id: number, formatTag?: string) => void;
};

export default function DetailPanel({ element, ...rest }: DetailPanelProps) {
  if (!element) {
    return (
      <div className="w-96 shrink-0 border-l border-border bg-bg-panel/60 flex items-center justify-center text-text-faint text-sm p-6 text-center">
        Select an element to preview and edit its metadata.
      </div>
    );
  }

  // Keying by element.id (React's recommended pattern for "reset state when
  // a prop changes") remounts the form fresh per element instead of syncing
  // via an effect, and restarts the preview video for the newly selected row.
  return <DetailPanelForm key={element.id} element={element} {...rest} />;
}

function DetailPanelForm({
  element,
  onPatch,
  onAddTag,
  onRemoveTag,
  onReveal,
}: DetailPanelProps & { element: Element }) {
  const [category, setCategory] = useState(element.user_category ?? "");
  const [notes, setNotes] = useState(element.user_notes ?? "");
  const [title, setTitle] = useState(element.user_title ?? "");
  const [tagInput, setTagInput] = useState("");

  function commit(patch: Partial<Element>) {
    onPatch(element.id, patch);
  }

  const hasVideo = element.preview_video_rel_path !== null;
  const hasImage = element.preview_image_rel_path !== null;

  return (
    <div className="w-96 shrink-0 border-l border-border bg-bg-panel/60 flex flex-col h-full overflow-y-auto">
      <div className="aspect-video w-full bg-black flex items-center justify-center shrink-0">
        {hasVideo ? (
          <video
            key={element.id}
            src={`/api/elements/${element.id}/preview`}
            poster={hasImage ? `/api/elements/${element.id}/thumbnail` : undefined}
            controls
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-contain bg-black"
          />
        ) : hasImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`/api/elements/${element.id}/thumbnail`}
            alt=""
            className="w-full h-full object-contain bg-black"
          />
        ) : (
          <span className="text-text-faint text-sm">No preview available</span>
        )}
      </div>

      <div className="px-4 py-3 border-b border-border">
        <div className="text-sm font-medium truncate" title={element.base_name}>
          {element.display_name}
        </div>
        <div className="text-xs text-text-faint truncate" title={element.dir_path}>
          {element.pack_name ?? "—"} / {element.dir_path || "."}
        </div>
      </div>

      <div className="px-4 py-4">
        <Field label="Display title (override)">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => commit({ user_title: title || null })}
            placeholder={element.display_name}
            className={inputClass}
          />
        </Field>

        <Field label="Category">
          <input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            onBlur={() => commit({ user_category: category || null })}
            placeholder="smoke, fire, debris…"
            className={inputClass}
          />
        </Field>

        <Field label="Notes">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={() => commit({ user_notes: notes || null })}
            rows={3}
            className={`${inputClass} resize-none`}
          />
        </Field>

        <Field label="Rating">
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                onClick={() => commit({ user_rating: element.user_rating === n ? null : n })}
                className={`text-lg ${
                  (element.user_rating ?? 0) >= n ? "text-accent-amber" : "text-text-faint"
                }`}
              >
                ★
              </button>
            ))}
          </div>
        </Field>

        <Field label="Tags">
          <div className="flex flex-wrap gap-1.5 mb-2">
            {element.tags.map((t) => (
              <span
                key={t}
                className="inline-flex items-center gap-1 text-xs bg-bg-panel-raised border border-border rounded-full px-2 py-0.5"
              >
                {t}
                <button
                  onClick={() => onRemoveTag(element.id, t)}
                  className="text-text-faint hover:text-danger"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && tagInput.trim()) {
                onAddTag(element.id, tagInput.trim());
                setTagInput("");
              }
            }}
            placeholder="Add tag, press Enter"
            className={inputClass}
          />
        </Field>

        <Field label={`Available formats (${element.formats.length})`}>
          {element.formats.length === 0 ? (
            <div className="text-xs text-text-faint">No source format files found.</div>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {element.formats.map((f) => (
                <button
                  key={`${f.tag}-${f.ext}-${f.rel_path}`}
                  onClick={() => onReveal(element.id, f.tag)}
                  title={`Reveal ${f.rel_path} in Explorer`}
                  className="text-xs bg-bg-panel-raised border border-border rounded px-2 py-1 text-text-dim hover:text-accent-blue-light hover:border-accent-blue"
                >
                  {formatLabel(f)}
                </button>
              ))}
            </div>
          )}
        </Field>

        <div className="mt-4 pt-4 border-t border-border text-xs text-text-faint space-y-1">
          <div>Pack: {element.pack_name ?? "—"}</div>
          <div>Folder: {element.dir_path || "."}</div>
          {element.missing === 1 && (
            <div className="text-danger">Not found on last scan — files may have moved or been deleted.</div>
          )}
        </div>

        <button
          onClick={() => onReveal(element.id)}
          disabled={element.formats.length === 0 && !hasVideo && !hasImage}
          className="mt-2 w-full px-3 py-1.5 rounded text-sm text-text-dim hover:text-accent-blue-light border border-border hover:border-accent-blue disabled:opacity-30"
        >
          Reveal highest-res format in Explorer
        </button>
      </div>
    </div>
  );
}
