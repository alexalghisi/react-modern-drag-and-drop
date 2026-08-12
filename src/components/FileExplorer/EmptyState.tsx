import { Folder } from "lucide-react";

export function EmptyState() {
  return (
    <div className="flex h-48 flex-col items-center justify-center text-muted-foreground">
      <Folder className="mb-3 h-12 w-12 stroke-1 text-muted-foreground/30" />
      <p className="text-sm">This folder is empty</p>
      <p className="mt-1 text-xs text-muted-foreground/70">Drag files here or create new ones</p>
    </div>
  );
}
