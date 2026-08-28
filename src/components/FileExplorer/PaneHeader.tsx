import { FilePlus, FolderPlus, PanelRight, X } from "lucide-react";
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
    <div className="flex shrink-0 items-center justify-between border-b border-black/5 bg-titlebar/70 px-2 py-1.5">
      <Breadcrumbs
        paneId={pane.id}
        folderId={pane.folderId}
        crumbs={crumbs}
        onNavigate={(folderId) => openFolder(pane.id, folderId)}
      />
      <div className="ml-2 flex shrink-0 items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-[12px]"
          onClick={() =>
            openDialog({ kind: "create", parentId: pane.folderId, nodeType: "folder" })
          }
        >
          <FolderPlus className="h-3.5 w-3.5 text-primary" />
          Folder
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-[12px]"
          onClick={() => openDialog({ kind: "create", parentId: pane.folderId, nodeType: "file" })}
        >
          <FilePlus className="h-3.5 w-3.5" />
          File
        </Button>
        {canClose && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => removePane(pane.id)}
            aria-label="Close pane"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
}

export function WindowToolbar() {
  const addPane = useExplorerStore((state) => state.addPane);

  return (
    <header className="flex shrink-0 items-center gap-3 border-b border-black/5 bg-titlebar px-3 py-2">
      <div className="flex items-center gap-1.5" aria-hidden>
        <span className="h-3 w-3 rounded-full bg-[#FF5F57] ring-1 ring-black/10" />
        <span className="h-3 w-3 rounded-full bg-[#FEBC2E] ring-1 ring-black/10" />
        <span className="h-3 w-3 rounded-full bg-[#28C840] ring-1 ring-black/10" />
      </div>
      <h1 className="flex-1 text-center text-[13px] font-semibold tracking-tight text-foreground/80">
        Files
      </h1>
      <Button
        variant="outline"
        size="sm"
        className="h-7 rounded-md px-2 text-[12px]"
        onClick={addPane}
        data-testid="button-add-pane"
      >
        <PanelRight className="h-3.5 w-3.5" />
        Open pane
      </Button>
    </header>
  );
}
