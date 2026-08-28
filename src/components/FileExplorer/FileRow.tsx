import type { HTMLAttributes, MouseEvent } from "react";
import {
  ArrowDown,
  ArrowUp,
  Check,
  ChevronRight,
  FolderInput,
  Lock,
  MoreVertical,
  Pencil,
  Shield,
  ShieldOff,
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
import { NodeIcon } from "./NodeIcon";
import { cn } from "@/lib/utils";
import { isMandatoryFile, subtreeHasMandatory } from "@/lib/tree";
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
  const nodes = useExplorerStore((state) => state.nodes);
  const selectedIds = useExplorerStore((state) => state.selectedIds);
  const selectRow = useExplorerStore((state) => state.selectRow);
  const openFolder = useExplorerStore((state) => state.openFolder);
  const openDialog = useExplorerStore((state) => state.openDialog);
  const deleteNodes = useExplorerStore((state) => state.deleteNodes);
  const reorder = useExplorerStore((state) => state.reorder);
  const effectiveIds = useExplorerStore((state) => state.effectiveIds);
  const setMandatory = useExplorerStore((state) => state.setMandatory);

  const isSelected = selectedIds.has(node.id);
  const isRequired = isMandatoryFile(node);
  const cannotDelete = subtreeHasMandatory(nodes, [node.id]);
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
        "group relative grid cursor-pointer select-none grid-cols-12 items-center gap-3 rounded-md border border-transparent px-3 py-1.5 transition-colors hover:bg-secondary/80",
        isSelected && "bg-[#0064D2] text-white hover:bg-[#0064D2]",
        isDropTarget && "bg-primary/10 ring-1 ring-primary/40",
        isDragging && "opacity-40",
      )}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      data-testid={`row-${node.type}-${node.id}`}
      data-row
      data-mandatory={isRequired ? "true" : undefined}
      data-reorder-target={isReorderTarget ? "true" : undefined}
      {...dragHandleProps}
    >
      {isReorderTarget && (
        <div
          className="absolute -top-px right-3 left-3 h-0.5 rounded-full bg-primary"
          aria-hidden
        />
      )}
      <div className="col-span-1 flex items-center">
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            selectRow(node, index, { metaKey: true }, items, paneId);
          }}
          className="rounded p-0.5 transition-colors hover:bg-black/5"
          aria-label={isSelected ? `Deselect ${node.name}` : `Select ${node.name}`}
          aria-pressed={isSelected}
        >
          {isSelected ? (
            <Check className="h-3.5 w-3.5 text-white" />
          ) : (
            <Square className="h-3.5 w-3.5 text-muted-foreground/50" />
          )}
        </button>
      </div>

      <div className="col-span-6 flex items-center gap-2 overflow-hidden md:col-span-5">
        <NodeIcon node={node} />
        <span className="truncate text-[13px]">{node.name}</span>
        {isRequired && (
          <span
            className={cn(
              "inline-flex shrink-0 items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-medium",
              isSelected ? "bg-white/20 text-white" : "bg-amber-100 text-amber-800",
            )}
            title="Required files cannot be deleted or moved out of this folder"
          >
            <Lock className="h-2.5 w-2.5" />
            Required
          </span>
        )}
      </div>

      <div
        className={cn(
          "col-span-2 hidden truncate text-[12px] md:block",
          isSelected ? "text-white/80" : "text-muted-foreground",
        )}
      >
        {node.updatedAt}
      </div>

      <div
        className={cn(
          "col-span-2 hidden text-[12px] tabular-nums md:block",
          isSelected ? "text-white/80" : "text-muted-foreground",
        )}
      >
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
              className={cn(
                "h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 data-[state=open]:opacity-100",
                isSelected && "text-white hover:bg-white/15",
              )}
              aria-label={`Actions for ${node.name}`}
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            {node.type === "folder" && (
              <DropdownMenuItem onClick={() => openFolder(paneId, node.id)}>
                <FolderInput className="mr-2 h-4 w-4 text-muted-foreground" /> Open
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => openDialog({ kind: "rename", node })}>
              <Pencil className="mr-2 h-4 w-4 text-muted-foreground" /> Rename
            </DropdownMenuItem>
            <DropdownMenuItem disabled={isRequired} onClick={requestMove}>
              <ChevronRight className="mr-2 h-4 w-4 text-muted-foreground" /> Move to...{suffix}
            </DropdownMenuItem>
            {node.type === "file" && (
              <DropdownMenuItem onClick={() => setMandatory(node.id, !isRequired)}>
                {isRequired ? (
                  <>
                    <ShieldOff className="mr-2 h-4 w-4 text-muted-foreground" /> Remove requirement
                  </>
                ) : (
                  <>
                    <Shield className="mr-2 h-4 w-4 text-muted-foreground" /> Mark as required
                  </>
                )}
              </DropdownMenuItem>
            )}
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
              disabled={cannotDelete}
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
