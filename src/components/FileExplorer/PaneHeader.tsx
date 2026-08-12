import { FilePlus, FolderPlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Breadcrumbs } from "./Breadcrumbs";
import { useExplorerStore } from "@/store/explorerStore";
import { getBreadcrumbs } from "@/lib/tree";
import type { Pane } from "@/types";

interface PaneHeaderProps {
  pane: Pane;
  canClose: boolean;
}

export function PaneHeader({ pane, canClose }: PaneHeaderProps) {
  const nodes = useExplorerStore((state) => state.nodes);
  const openFolder = useExplorerStore((state) => state.openFolder);
  const openDialog = useExplorerStore((state) => state.openDialog);
  const removePane = useExplorerStore((state) => state.removePane);

  const crumbs = getBreadcrumbs(nodes, pane.folderId);

  return (
    <div className="flex shrink-0 items-center justify-between border-b bg-muted/30 p-3">
      <Breadcrumbs
        paneId={pane.id}
        folderId={pane.folderId}
        crumbs={crumbs}
        onNavigate={(folderId) => openFolder(pane.id, folderId)}
      />
      <div className="ml-2 flex shrink-0 items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            openDialog({ kind: "create", parentId: pane.folderId, nodeType: "folder" })
          }
        >
          <FolderPlus className="mr-1 h-4 w-4 text-primary" />
          Folder
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => openDialog({ kind: "create", parentId: pane.folderId, nodeType: "file" })}
        >
          <FilePlus className="mr-1 h-4 w-4" />
          File
        </Button>
        {canClose && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => removePane(pane.id)}
            aria-label="Close pane"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
