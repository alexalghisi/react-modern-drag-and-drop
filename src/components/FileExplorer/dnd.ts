import type { FileNode } from "@/types";

/**
 * Payload attached to every draggable and droppable. The original version
 * encoded the folder id inside the DOM id (`empty-p0-<folderId>`) and parsed it
 * back out, which silently broke for any id containing a dash. Carrying typed
 * data instead removes the parsing entirely.
 */
export type DropData =
  | { kind: "row"; node: FileNode; paneId: string }
  | { kind: "crumb"; folderId: string | null; paneId: string }
  | { kind: "pane"; folderId: string | null; paneId: string };

export function asDropData(data: unknown): DropData | null {
  if (typeof data !== "object" || data === null) return null;
  const candidate = data as Partial<DropData>;
  return candidate.kind === "row" || candidate.kind === "crumb" || candidate.kind === "pane"
    ? (candidate as DropData)
    : null;
}
