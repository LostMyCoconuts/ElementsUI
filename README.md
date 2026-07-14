# ElementsUI

A web-based browser for a local VFX element library — previewing stock smoke,
fire, debris, and similar clips without opening every heavy source file in a
video player. Sibling project to [SamplesUI](https://github.com/LostMyCoconuts/SamplesUI),
same idea applied to video instead of audio.

### "Wow, Coconuts this is awesome"
Is it? Glad you think so.
Feel free to use it, don't sue me if something goes wrong.
That's about it.

#### "How did you do this?"
*I didn't, Claude did. Maybe. Ehh, I'll help out a bit.*

## Running it

```
npm install
npm run dev
```

Then open http://localhost:4000, click "+ Add" in the sidebar, and point it at
a folder of VFX elements. It scans recursively, matches each clip's
resolution/format variants and low-res preview files together by filename
convention, and indexes everything into a local SQLite file at
`.data/library.sqlite3` (gitignored, never touches your source files).

Runs on port 4000 (instead of SamplesUI's 3000) so both apps can run side by
side.

## Element naming convention

Source files are expected to share a common base name with a trailing
resolution/format token, and previews use the same base name with `_preview`:

```
Displaced_Fog_1_1198_2K.mov
Displaced_Fog_1_1198_4K.mov
Displaced_Fog_1_1198_6K.exr
Displaced_Fog_1_1198_preview.mp4
Displaced_Fog_1_1198_preview.jpg
```

These all resolve to one element, "Displaced Fog 1 1198", with formats listed
as `2K · 4K · 6K (EXR)`. Preview stills/clips can either sit next to the
source files or live in `Image Previews` / `Video Previews` subfolders
anywhere under the same collection folder — the collection (top-level) folder
name becomes the element's "Pack". Elements with no matching preview files
still show up, just with no thumbnail/playback. Source format files are never
served over HTTP (they can be multi-GB); use "Reveal in Explorer" to grab the
real file.
