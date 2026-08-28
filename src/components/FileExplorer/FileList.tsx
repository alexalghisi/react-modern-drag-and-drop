import { Check, Square } from "lucide-react";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { SortableFileRow } from "./SortableFileRow";
import { EmptyState } from "./EmptyState";
import { useExplorerStore } from "@/store/explorerStore";
import type { FileNode } from "@/types";

interface FileListProps {
  items: FileNode[];
  paneId: string;
}

export function FileList({ items, paneId }: FileListProps) {
  const selectedIds = useExplorerStore((state) => state.selectedIds);
  const selectAll = useExplorerStore((state) => state.selectAll);
  const dropTarget = useExplorerStore((state) => state.dropTarget);
  const reorderTarget = useExplorerStore((state) => state.reorderTarget);

  const allSelected = items.length > 0 && items.every((item) => selectedIds.has(item.id));

  return (
    <>
      <div className="grid grid-cols-12 gap-3 border-b border-black/5 px-3 pb-1.5 text-[11px] font-medium tracking-wide text-muted-foreground">
        <div className="col-span-1 flex items-center">
          <button
            type="button"
            onClick={() => selectAll(!allSelected, items)}
            className="rounded p-0.5 transition-colors hover:bg-black/5"
            aria-label={allSelected ? "Deselect all" : "Select all"}
            aria-pressed={allSelected}
          >
            {allSelected ? (
              <Check className="h-3.5 w-3.5 text-primary" />
            ) : (
              <Square className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
        <div className="col-span-6 md:col-span-5">Name</div>
        <div className="col-span-2 hidden md:block">Date Modified</div>
        <div className="col-span-2 hidden md:block">Size</div>
        <div className="col-span-5 text-right md:col-span-2" />
      </div>

      {items.length === 0 ? (
        <EmptyState />
      ) : (
        <SortableContext
          items={items.map((item) => item.id)}
          strategy={verticalListSortingStrategy}
        >
          <ul className="mt-1 flex flex-col">
            {items.map((node, index) => (
              <li key={node.id}>
                <SortableFileRow
                  node={node}
                  index={index}
                  items={items}
                  paneId={paneId}
                  isDropTarget={dropTarget?.paneId === paneId && dropTarget.nodeId === node.id}
                  isReorderTarget={
                    reorderTarget?.paneId === paneId && reorderTarget.index === index
                  }
                />
              </li>
            ))}
          </ul>
        </SortableContext>
      )}
    </>
  );
}
