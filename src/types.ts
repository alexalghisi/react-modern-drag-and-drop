export type NodeType = "file" | "folder";

/** A single entry in the virtual file tree. `parentId: null` means it sits at the root. */
export interface FileNode {
  id: string;
  name: string;
  type: NodeType;
  parentId: string | null;
  /** Position among siblings. Siblings are always renumbered densely from 0. */
  order: number;
  size?: string;
  updatedAt: string;
  /**
   * Required files cannot be deleted, and cannot leave their parent folder.
   * Reordering among siblings is still allowed.
   */
  mandatory?: boolean;
}

/** One independently navigable column of the explorer. */
export interface Pane {
  id: string;
  folderId: string | null;
}

/** Highlight state for "you are about to drop into this folder". */
export interface DropTarget {
  paneId: string;
  nodeId: string;
}

/** Highlight state for "you are about to insert at this index". */
export interface ReorderTarget {
  paneId: string;
  index: number;
}
