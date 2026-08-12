import type { HTMLAttributes, MouseEvent } from "react";
import {
  ArrowDown,
  ArrowUp,
  Check,
  ChevronRight,
  File as FileIcon,
  Folder,
  FolderInput,
  MoreVertical,
  Pencil,
  Square,
  Trash2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useExplorerStore } from "@/store/explorerStore";
import type { FileNode } from "@/types";

export interface FileRowProps {
  node: FileNode;
  index: number;
  items: FileNode[];
  paneId: string;
  dragHandleProps?: HTMLAttributes<HTMLElement>;
  isDragging?: boolean;
  isDropTarget?: boolean;
  isReorderTarget?: boolean;
}

export function FileRow({
  node,
  index,
  items,
  paneId,
  dragHandleProps,
  isDragging = false,
  isDropTarget = false,
  isReorderTarget = false,
}: FileRowProps) {
  const selectedIds = useExplorerStore((state) => state.selectedIds);
  const selectRow = useExplorerStore((state) => state.selectRow);
  const openFolder = useExplorerStore((state) => state.openFolder);
  const openDialog = useExplorerStore((state) => state.openDialog);
  const deleteNodes = useExplorerStore((state) => state.deleteNodes);
  const reorder = useExplorerStore((state) => state.reorder);
  const effectiveIds = useExplorerStore((state) => state.effectiveIds);

  const isSelected = selectedIds.has(node.id);
  const multiCount = isSelected && selectedIds.size > 1 ? selectedIds.size : 0;
  const suffix = multiCount > 0 ? ` (${String(multiCount)})` : "";

  const canMoveUp = index > 0;
  const canMoveDown = index < items.length - 1;

  const handleClick = (event: MouseEvent<HTMLDivElement>) => {
    if (event.detail === 2) return;
    selectRow(node, index, event, items, paneId);
  };

  const handleDoubleClick = (event: MouseEvent<HTMLDivElement>) => {
    event.stopPropagation();
    if (node.type === "folder") openFolder(paneId, node.id);
  };

  const requestMove = () => {
    openDialog({ kind: "move", nodeIds: effectiveIds(node.id), primary: node });
  };

  return (
    <div
      className={cn(
        // Column spans must total 12 at every breakpoint, otherwise the last
        // cell wraps onto a second line and doubles the row height.
        // select-none stops the pointer gesture from selecting row text.
        "group relative grid select-none cursor-pointer grid-cols-12 items-center gap-4 rounded-xl border border-transparent px-4 py-3 transition-colors hover:bg-secondary/60",
        isSelected && "bg-primary/10 ring-1 ring-primary/20",
        isDropTarget && "border-primary bg-primary/5 ring-1 ring-primary/20",
        isReorderTarget && "ring-2 ring-inset ring-primary",
        isDragging && "opacity-40",
      )}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      data-testid={`row-${node.type}-${node.id}`}
      data-row
      {...dragHandleProps}
    >
      <div className="col-span-1 flex items-center">
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            selectRow(node, index, { metaKey: true }, items, paneId);
          }}
          className="rounded p-1 transition-colors hover:bg-secondary/60"
          aria-label={isSelected ? `Deselect ${node.name}` : `Select ${node.name}`}
          aria-pressed={isSelected}
        >
          {isSelected ? (
            <Check className="h-4 w-4 text-primary" />
          ) : (
            <Square className="h-4 w-4 text-muted-foreground" />
          )}
        </button>
      </div>

      <div className="col-span-6 flex items-center gap-3 overflow-hidden md:col-span-5">
        <div
          className={cn(
            "rounded-lg p-2",
            node.type === "folder"
              ? "bg-primary/10 text-primary"
              : "bg-muted text-muted-foreground",
          )}
        >
          {node.type === "folder" ? (
            <Folder className="h-5 w-5" />
          ) : (
            <FileIcon className="h-5 w-5" />
          )}
        </div>
        <span className={cn("truncate font-medium", node.type === "file" && "font-mono text-sm")}>
          {node.name}
        </span>
      </div>

      <div className="col-span-2 hidden truncate text-sm text-muted-foreground md:block">
        {node.updatedAt}
      </div>

      <div className="col-span-2 hidden text-sm text-muted-foreground md:block">
        {node.size ?? "--"}
      </div>

      <div
        className="col-span-5 flex justify-end md:col-span-2"
        onClick={(event) => event.stopPropagation()}
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 data-[state=open]:opacity-100"
              aria-label={`Actions for ${node.name}`}
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {node.type === "folder" && (
              <DropdownMenuItem onClick={() => openFolder(paneId, node.id)}>
                <FolderInput className="mr-2 h-4 w-4 text-muted-foreground" /> Open
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => openDialog({ kind: "rename", node })}>
              <Pencil className="mr-2 h-4 w-4 text-muted-foreground" /> Rename
            </DropdownMenuItem>
            <DropdownMenuItem onClick={requestMove}>
              <ChevronRight className="mr-2 h-4 w-4 text-muted-foreground" /> Move to...{suffix}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled={!canMoveUp} onClick={() => reorder(node.id, index - 1)}>
              <ArrowUp className="mr-2 h-4 w-4 text-muted-foreground" /> Move up
            </DropdownMenuItem>
            <DropdownMenuItem disabled={!canMoveDown} onClick={() => reorder(node.id, index + 1)}>
              <ArrowDown className="mr-2 h-4 w-4 text-muted-foreground" /> Move down
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:bg-destructive/10 focus:text-destructive"
              onClick={() => deleteNodes(effectiveIds(node.id))}
            >
              <Trash2 className="mr-2 h-4 w-4" /> Delete{suffix}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
