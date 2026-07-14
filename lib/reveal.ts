import { exec, execFile } from "node:child_process";
import os from "node:os";
import path from "node:path";

// Source format files can be multi-GB, so ElementsUI never serves them over
// HTTP — instead this opens Explorer with the file pre-selected so the user
// can grab it (or drag it into another app) themselves, the same way you'd
// drag out of a Downloads folder.
export function revealInFileManager(absPath: string): void {
  const platform = os.platform();

  if (platform === "win32") {
    // explorer.exe does its own raw command-line parsing for /select, rather
    // than standard argv parsing — execFile's automatic quoting wraps the
    // *entire* argument (including the "/select," prefix) when the path has
    // spaces, which explorer's parser can't handle, and it silently falls
    // back to the default folder. Using exec (shell-invoked) with the quotes
    // placed only around the path, as explorer itself expects, avoids that.
    // Paths here always come from the trusted elements DB, never raw request
    // input, but strip stray quote characters defensively regardless.
    const safePath = absPath.replace(/"/g, "");
    exec(`explorer.exe /select,"${safePath}"`, () => {});
  } else if (platform === "darwin") {
    execFile("open", ["-R", absPath], () => {});
  } else {
    execFile("xdg-open", [path.dirname(absPath)], () => {});
  }
}
