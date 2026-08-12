import { NameFormDialog } from "./NameFormDialog";
import { MoveDialog } from "./MoveDialog";
import { useExplorerStore } from "@/store/explorerStore";

/** Renders whichever dialog the store says is open, and nothing otherwise. */
export function ExplorerDialogs() {
  const dialog = useExplorerStore((state) => state.dialog);
  const closeDialog = useExplorerStore((state) => state.closeDialog);
  const createNode = useExplorerStore((state) => state.createNode);
  const submitRename = useExplorerStore((state) => state.submitRename);

  if (dialog === null) return null;

  switch (dialog.kind) {
    case "create": {
      const noun = dialog.nodeType === "folder" ? "Folder" : "File";
      return (
        <NameFormDialog
          title={`Create New ${noun}`}
          description={`The new ${noun.toLowerCase()} is added to the folder you are viewing.`}
          fieldLabel={`${noun} name`}
          submitLabel="Create"
          placeholder={`Enter ${noun.toLowerCase()} name...`}
          testId="create"
          onSubmit={createNode}
          onClose={closeDialog}
        />
      );
    }
    case "rename":
      return (
        <NameFormDialog
          title={`Rename ${dialog.node.type}`}
          description={`Choose a new name for "${dialog.node.name}".`}
          fieldLabel="New name"
          submitLabel="Save"
          initialName={dialog.node.name}
          testId="rename"
          onSubmit={submitRename}
          onClose={closeDialog}
        />
      );
    case "move":
      return <MoveDialog nodeIds={dialog.nodeIds} primary={dialog.primary} />;
  }
}
