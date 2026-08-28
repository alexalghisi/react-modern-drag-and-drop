import { ChevronRight, Home } from "lucide-react";
import { useDroppable } from "@dnd-kit/core";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { DropData } from "./dnd";
import type { FileNode } from "@/types";

interface CrumbButtonProps {
  paneId: string;
  folderId: string | null;
  isCurrent: boolean;
  onNavigate: (folderId: string | null) => void;
  label: string;
  showHomeIcon?: boolean;
}

/** A breadcrumb doubles as a drop target, so you can move items up the tree. */
function CrumbButton({
  paneId,
  folderId,
  isCurrent,
  onNavigate,
  label,
  showHomeIcon = false,
}: CrumbButtonProps) {
  const data: DropData = { kind: "crumb", folderId, paneId };
  const { setNodeRef, isOver } = useDroppable({
    id: `crumb:${paneId}:${folderId ?? "root"}`,
    data,
  });

  return (
    <button
      ref={setNodeRef}
      type="button"
      onClick={() => onNavigate(folderId)}
      className={cn(
        "flex shrink-0 items-center whitespace-nowrap rounded-md px-2 py-1 text-[12px] transition-colors",
        isCurrent
          ? "bg-white font-medium text-foreground shadow-sm ring-1 ring-black/10"
          : "text-muted-foreground hover:bg-black/5 hover:text-foreground",
        isOver && "bg-primary/10 ring-2 ring-primary/50",
      )}
      aria-current={isCurrent ? "location" : undefined}
    >
      {showHomeIcon && <Home className="mr-1 h-4 w-4" />}
      {label}
    </button>
  );
}

interface BreadcrumbsProps {
  paneId: string;
  folderId: string | null;
  crumbs: FileNode[];
  onNavigate: (folderId: string | null) => void;
}

export function Breadcrumbs({ paneId, folderId, crumbs, onNavigate }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className="flex min-w-0 flex-1 items-center gap-1 py-1 text-sm">
      <CrumbButton
        paneId={paneId}
        folderId={null}
        isCurrent={folderId === null}
        onNavigate={onNavigate}
        label="Home"
        showHomeIcon
      />
      <ScrollArea className="min-w-0 flex-1">
        <div className="flex w-max items-center gap-1">
          {crumbs.map((crumb) => (
            <div key={crumb.id} className="flex shrink-0 items-center gap-1">
              <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
              <CrumbButton
                paneId={paneId}
                folderId={crumb.id}
                isCurrent={folderId === crumb.id}
                onNavigate={onNavigate}
                label={crumb.name}
              />
            </div>
          ))}
        </div>
      </ScrollArea>
    </nav>
  );
}
