import { Folder, Home } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useExplorerStore } from "@/store/explorerStore";
import { getAllFolders, isDescendantOf } from "@/lib/tree";
import type { FileNode } from "@/types";

interface MoveDialogProps {
  nodeIds: string[];
  primary: FileNode;
}

export function MoveDialog({ nodeIds, primary }: MoveDialogProps) {
  const nodes = useExplorerStore((state) => state.nodes);
  const destination = useExplorerStore((state) => state.moveDestination);
  const setDestination = useExplorerStore((state) => state.setMoveDestination);
  const submitMove = useExplorerStore((state) => state.submitMove);
  const closeDialog = useExplorerStore((state) => state.closeDialog);

  // A folder cannot be moved into itself or into anything nested inside it, so
  // those destinations are hidden rather than offered and then rejected.
  const destinations = getAllFolders(nodes).filter(
    (folder) => !nodeIds.some((id) => folder.id === id || isDescendantOf(nodes, folder.id, id)),
  );

  const label = nodeIds.length > 1 ? `${String(nodeIds.length)} items` : `"${primary.name}"`;

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) closeDialog();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Move {label} to...</DialogTitle>
          <DialogDescription>Pick the folder that should contain {label}.</DialogDescription>
        </DialogHeader>
        <div className="py-2">
          <Select value={destination} onValueChange={setDestination}>
            <SelectTrigger data-testid="select-move-destination">
              <SelectValue placeholder="Select destination" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="root">
                <div className="flex items-center gap-2">
                  <Home className="h-4 w-4" /> Home (Root)
                </div>
              </SelectItem>
              {destinations.map((folder) => (
                <SelectItem key={folder.id} value={folder.id}>
                  <div className="flex items-center gap-2">
                    <Folder className="h-4 w-4 text-primary" /> {folder.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={closeDialog}>
            Cancel
          </Button>
          <Button onClick={submitMove} data-testid="button-move-submit">
            Move Here
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
