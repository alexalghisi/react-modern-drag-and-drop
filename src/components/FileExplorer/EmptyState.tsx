import { Folder } from "lucide-react";

export function EmptyState() {
  return (
    <div className="flex h-48 flex-col items-center justify-center text-muted-foreground">
      <Folder className="mb-3 h-11 w-11 stroke-1 text-muted-foreground/25" />
      <p className="text-[13px]">This folder is empty</p>
      <p className="mt-1 text-[12px] text-muted-foreground/70">
        Drag files here, or create a new one
      </p>
    </div>
  );
}
