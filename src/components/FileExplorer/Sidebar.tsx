import type { ReactNode } from "react";
import { Home } from "lucide-react";
import { NodeIcon } from "./NodeIcon";
import { cn } from "@/lib/utils";
import { getChildren } from "@/lib/tree";
import { useExplorerStore } from "@/store/explorerStore";

interface SidebarProps {
  paneId: string;
}

export function Sidebar({ paneId }: SidebarProps) {
  const nodes = useExplorerStore((state) => state.nodes);
  const panes = useExplorerStore((state) => state.panes);
  const openFolder = useExplorerStore((state) => state.openFolder);

  const currentId = panes.find((pane) => pane.id === paneId)?.folderId ?? null;
  const favorites = getChildren(nodes, null).filter((node) => node.type === "folder");

  return (
    <nav
      aria-label="Favorites"
      className="flex w-[168px] shrink-0 flex-col border-r border-black/5 bg-sidebar/90 px-2 py-3 backdrop-blur-md"
    >
      <p className="px-2 pb-1.5 text-[11px] font-semibold tracking-wide text-muted-foreground/80">
        Favorites
      </p>
      <SidebarButton
        label="All Files"
        active={currentId === null}
        onClick={() => openFolder(paneId, null)}
        icon={<Home className="h-4 w-4 text-sky-600" />}
      />
      {favorites.map((folder) => (
        <SidebarButton
          key={folder.id}
          label={folder.name.replaceAll("_", " ")}
          active={currentId === folder.id}
          onClick={() => openFolder(paneId, folder.id)}
          icon={<NodeIcon node={folder} className="h-4 w-4" />}
        />
      ))}
    </nav>
  );
}

function SidebarButton({
  label,
  active,
  onClick,
  icon,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2 rounded-md px-2 py-1 text-left text-[13px] transition-colors",
        active
          ? "bg-primary/90 font-medium text-primary-foreground shadow-sm"
          : "text-foreground/80 hover:bg-black/5",
      )}
    >
      {icon}
      <span className="truncate">{label}</span>
    </button>
  );
}
