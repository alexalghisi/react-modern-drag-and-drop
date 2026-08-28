import { create } from "zustand";
import { toast } from "sonner";
import { SEED_NODES, formatToday } from "@/lib/seed";
import {
  findNode,
  getChildren,
  moveNodes,
  nextOrder,
  partitionDeletable,
  partitionMovable,
  removeNodes,
  renameNode,
  reorderWithinFolder,
  setNodeMandatory,
  wouldCreateCycle,
} from "@/lib/tree";
import type { DropTarget, FileNode, NodeType, Pane, ReorderTarget } from "@/types";

/**
 * Only one dialog is ever open, and each one needs different data. A union
 * makes the impossible combinations unrepresentable.
 */
export type DialogState =
  | { kind: "create"; parentId: string | null; nodeType: NodeType }
  | { kind: "rename"; node: FileNode }
  | { kind: "move"; nodeIds: string[]; primary: FileNode }
  | null;

export interface ClickModifiers {
  metaKey?: boolean;
  ctrlKey?: boolean;
  shiftKey?: boolean;
}

interface ExplorerState {
  nodes: FileNode[];
  panes: Pane[];
  selectedIds: Set<string>;

  draggedId: string | null;
  dropTarget: DropTarget | null;
  reorderTarget: ReorderTarget | null;

  dialog: DialogState;
  /** Anchor for shift-click range selection. */
  lastClick: { paneId: string; index: number } | null;

  moveDestination: string;

  setDraggedId: (id: string | null) => void;
  setDropTarget: (target: DropTarget | null) => void;
  setReorderTarget: (target: ReorderTarget | null) => void;
  setMoveDestination: (id: string) => void;

  openDialog: (dialog: DialogState) => void;
  closeDialog: () => void;

  clearSelection: () => void;
  selectRow: (
    node: FileNode,
    index: number,
    modifiers: ClickModifiers,
    items: FileNode[],
    paneId: string,
  ) => void;
  selectAll: (checked: boolean, items: FileNode[]) => void;

  /**
   * Ids an action should apply to: the whole selection when the clicked or
   * dragged row is part of it, otherwise just that row.
   */
  effectiveIds: (nodeId: string) => string[];

  createNode: (name: string) => void;
  submitRename: (name: string) => void;
  deleteNodes: (ids: string[]) => void;
  moveToFolder: (ids: string[], targetFolderId: string | null) => void;
  reorder: (draggedId: string, targetIndex: number) => void;
  submitMove: () => void;
  setMandatory: (id: string, mandatory: boolean) => void;

  openFolder: (paneId: string, folderId: string | null) => void;
  addPane: () => void;
  removePane: (paneId: string) => void;
}

export const useExplorerStore = create<ExplorerState>((set, get) => ({
  nodes: SEED_NODES,
  panes: [{ id: "p0", folderId: null }],
  selectedIds: new Set<string>(),

  draggedId: null,
  dropTarget: null,
  reorderTarget: null,

  dialog: null,
  lastClick: null,
  moveDestination: "root",

  setDraggedId: (id) => set({ draggedId: id }),
  setDropTarget: (target) => set({ dropTarget: target }),
  setReorderTarget: (target) => set({ reorderTarget: target }),
  setMoveDestination: (id) => set({ moveDestination: id }),

  openDialog: (dialog) =>
    set({
      dialog,
      moveDestination: dialog?.kind === "move" ? "root" : get().moveDestination,
    }),
  closeDialog: () => set({ dialog: null }),

  clearSelection: () => set({ selectedIds: new Set<string>() }),

  selectRow: (node, index, modifiers, items, paneId) => {
    const { selectedIds, lastClick } = get();

    if (modifiers.metaKey === true || modifiers.ctrlKey === true) {
      const next = new Set(selectedIds);
      if (next.has(node.id)) next.delete(node.id);
      else next.add(node.id);
      set({ selectedIds: next, lastClick: { paneId, index } });
      return;
    }

    if (modifiers.shiftKey === true && lastClick !== null && lastClick.paneId === paneId) {
      const low = Math.min(lastClick.index, index);
      const high = Math.max(lastClick.index, index);
      const next = new Set(selectedIds);
      for (const item of items.slice(low, high + 1)) next.add(item.id);
      set({ selectedIds: next });
      return;
    }

    set({ selectedIds: new Set([node.id]), lastClick: { paneId, index } });
  },

  selectAll: (checked, items) =>
    set({ selectedIds: checked ? new Set(items.map((item) => item.id)) : new Set<string>() }),

  effectiveIds: (nodeId) => {
    const { selectedIds } = get();
    return selectedIds.has(nodeId) && selectedIds.size > 1 ? [...selectedIds] : [nodeId];
  },

  createNode: (name) => {
    const { dialog, nodes } = get();
    if (dialog?.kind !== "create") return;

    const trimmed = name.trim();
    if (trimmed === "") return;

    const created: FileNode = {
      id: crypto.randomUUID(),
      name: trimmed,
      type: dialog.nodeType,
      parentId: dialog.parentId,
      order: nextOrder(nodes, dialog.parentId),
      updatedAt: formatToday(),
      ...(dialog.nodeType === "file" ? { size: "0 KB" } : {}),
    };

    set({ nodes: [...nodes, created], dialog: null });
    toast.success(`Created ${created.type} "${created.name}"`);
  },

  submitRename: (name) => {
    const { dialog, nodes } = get();
    if (dialog?.kind !== "rename") return;

    const trimmed = name.trim();
    if (trimmed === "") return;

    set({ nodes: renameNode(nodes, dialog.node.id, trimmed), dialog: null });
    toast.success(`Renamed to ${trimmed}`);
  },

  deleteNodes: (ids) => {
    if (ids.length === 0) return;
    const { nodes, selectedIds } = get();
    const { allowed, blocked } = partitionDeletable(nodes, ids);

    if (blocked.length > 0) {
      const names = blocked
        .map((id) => findNode(nodes, id)?.name)
        .filter((name): name is string => name !== undefined);
      toast.error(
        names.length === 1
          ? `"${names[0]}" is required and cannot be deleted`
          : "Required files cannot be deleted",
      );
    }

    if (allowed.length === 0) return;

    const next = new Set(selectedIds);
    for (const id of allowed) next.delete(id);

    set({ nodes: removeNodes(nodes, allowed), selectedIds: next });
    toast.success(allowed.length > 1 ? `${allowed.length} items deleted` : "Item deleted");
  },

  moveToFolder: (ids, targetFolderId) => {
    if (ids.length === 0) return;
    const { nodes, selectedIds } = get();

    if (ids.includes(targetFolderId ?? "")) return;

    if (wouldCreateCycle(nodes, ids, targetFolderId)) {
      toast.error("Cannot move a folder into its own subfolder");
      return;
    }

    const { allowed, blocked } = partitionMovable(nodes, ids, targetFolderId);

    if (blocked.length > 0) {
      toast.error("Required files must stay in their folder");
    }

    if (allowed.length === 0) return;

    const updated = moveNodes(nodes, allowed, targetFolderId);
    if (updated === nodes) return;

    const next = new Set(selectedIds);
    for (const id of allowed) next.delete(id);

    set({ nodes: updated, selectedIds: next });
    toast.success(allowed.length > 1 ? `${allowed.length} items moved` : "Item moved");
  },

  reorder: (draggedId, targetIndex) => {
    const { nodes } = get();
    const updated = reorderWithinFolder(nodes, draggedId, targetIndex);
    if (updated === nodes) return;
    set({ nodes: updated });
  },

  submitMove: () => {
    const { dialog, moveDestination, moveToFolder } = get();
    if (dialog?.kind !== "move") return;

    moveToFolder(dialog.nodeIds, moveDestination === "root" ? null : moveDestination);
    set({ dialog: null });
  },

  setMandatory: (id, mandatory) => {
    const { nodes } = get();
    const node = findNode(nodes, id);
    if (node === undefined || node.type !== "file") return;

    set({ nodes: setNodeMandatory(nodes, id, mandatory) });
    toast.success(
      mandatory ? `Marked "${node.name}" as required` : `Removed requirement from "${node.name}"`,
    );
  },

  openFolder: (paneId, folderId) =>
    set((state) => ({
      panes: state.panes.map((pane) => (pane.id === paneId ? { ...pane, folderId } : pane)),
      selectedIds: new Set<string>(),
    })),

  addPane: () =>
    set((state) => ({
      panes: [
        ...state.panes,
        { id: `p${String(state.panes.length)}-${String(Date.now())}`, folderId: null },
      ],
    })),

  removePane: (paneId) =>
    set((state) =>
      state.panes.length <= 1 ? state : { panes: state.panes.filter((pane) => pane.id !== paneId) },
    ),
}));

/** Selector helpers kept outside the store so they stay pure and reusable. */
export const selectItems = (folderId: string | null) => (state: ExplorerState) =>
  getChildren(state.nodes, folderId);

export const selectNode = (id: string) => (state: ExplorerState) => findNode(state.nodes, id);
