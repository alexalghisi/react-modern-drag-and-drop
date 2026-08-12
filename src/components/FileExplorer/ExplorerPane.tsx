import type { MouseEvent } from "react";
import { useDroppable } from "@dnd-kit/core";
import { PaneHeader } from "./PaneHeader";
import { FileList } from "./FileList";
import type { DropData } from "./dnd";
import { cn } from "@/lib/utils";
import { useExplorerStore } from "@/store/explorerStore";
import { getChildren } from "@/lib/tree";
import type { Pane } from "@/types";

interface ExplorerPaneProps {
  pane: Pane;
  canClose: boolean;
}

export function ExplorerPane({ pane, canClose }: ExplorerPaneProps) {
  const nodes = useExplorerStore((state) => state.nodes);
  const dropTarget = useExplorerStore((state) => state.dropTarget);
  const clearSelection = useExplorerStore((state) => state.clearSelection);

  const items = getChildren(nodes, pane.folderId);

  const data: DropData = { kind: "pane", folderId: pane.folderId, paneId: pane.id };
  const { setNodeRef, isOver } = useDroppable({
    id: `pane:${pane.id}`,
    data,
    // A droppable spanning the whole pane competes with the rows inside it:
    // its rect is far larger, so closestCenter and the keyboard coordinate
    // getter both pick it over the row the user is actually aiming at. Only the
    // empty state needs it; moving into the current folder is already covered
    // by its breadcrumb.
    disabled: items.length > 0,
  });

  const isPaneHighlighted = isOver && dropTarget === null;

  const handleBackgroundClick = (event: MouseEvent<HTMLDivElement>) => {
    if (!(event.target instanceof Element)) return;
    if (event.target.closest("[data-row]") === null && event.target.closest("button") === null) {
      clearSelection();
    }
  };

  return (
    <div className="flex min-w-0 flex-col">
      <PaneHeader pane={pane} canClose={canClose} />
      <div
        ref={setNodeRef}
        onClick={handleBackgroundClick}
        className={cn(
          "min-h-0 flex-1 overflow-y-auto p-4 transition-colors",
          isPaneHighlighted && "bg-primary/5 ring-1 ring-inset ring-primary/20",
        )}
      >
        <FileList items={items} paneId={pane.id} />
      </div>
    </div>
  );
}
