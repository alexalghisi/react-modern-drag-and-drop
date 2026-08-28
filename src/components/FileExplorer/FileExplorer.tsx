import { Fragment, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MeasuringStrategy,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  type ScreenReaderInstructions,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { ExplorerPane } from "./ExplorerPane";
import { ExplorerDialogs } from "./ExplorerDialogs";
import { NodeIcon } from "./NodeIcon";
import { WindowToolbar } from "./PaneHeader";
import { Sidebar } from "./Sidebar";
import { asDropData } from "./dnd";
import { findNode, getChildren, isMandatoryFile, partitionMovable } from "@/lib/tree";
import { useExplorerStore } from "@/store/explorerStore";

const screenReaderInstructions: ScreenReaderInstructions = {
  draggable:
    "To pick up an item, press space or enter. Use the arrow keys to move it, space or enter to drop it, and escape to cancel.",
};

export function FileExplorer() {
  const nodes = useExplorerStore((state) => state.nodes);
  const panes = useExplorerStore((state) => state.panes);
  const draggedId = useExplorerStore((state) => state.draggedId);
  const selectedIds = useExplorerStore((state) => state.selectedIds);

  const setDraggedId = useExplorerStore((state) => state.setDraggedId);
  const setDropTarget = useExplorerStore((state) => state.setDropTarget);
  const setReorderTarget = useExplorerStore((state) => state.setReorderTarget);
  const moveToFolder = useExplorerStore((state) => state.moveToFolder);
  const reorder = useExplorerStore((state) => state.reorder);
  const deleteNodes = useExplorerStore((state) => state.deleteNodes);
  const effectiveIds = useExplorerStore((state) => state.effectiveIds);
  const dialog = useExplorerStore((state) => state.dialog);

  const sensors = useSensors(
    // The 8px threshold keeps plain clicks (select, open menus) working while
    // the whole row still acts as a drag handle.
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const draggedNode = draggedId === null ? undefined : findNode(nodes, draggedId);
  const draggedCount = draggedId === null ? 0 : effectiveIds(draggedId).length;
  const requiredCount = nodes.filter(isMandatoryFile).length;

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Backspace" && event.key !== "Delete") return;
      if (dialog !== null || draggedId !== null || selectedIds.size === 0) return;
      if (event.target instanceof HTMLElement) {
        const tag = event.target.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || event.target.isContentEditable) return;
      }

      event.preventDefault();
      deleteNodes([...selectedIds]);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [deleteNodes, dialog, draggedId, selectedIds]);

  const resetDragState = () => {
    setDraggedId(null);
    setDropTarget(null);
    setReorderTarget(null);
  };

  const handleDragStart = (event: DragStartEvent) => {
    setDraggedId(String(event.active.id));
  };

  const handleDragOver = (event: DragOverEvent) => {
    const data = asDropData(event.over?.data.current);
    const activeId = String(event.active.id);

    if (data === null || data.kind !== "row") {
      setDropTarget(null);
      setReorderTarget(null);
      return;
    }

    const dragged = effectiveIds(activeId);
    const target = data.node;

    if (target.type === "folder" && !dragged.includes(target.id)) {
      const { allowed } = partitionMovable(nodes, dragged, target.id);
      if (allowed.length === 0) {
        setDropTarget(null);
        setReorderTarget(null);
        return;
      }
      setDropTarget({ paneId: data.paneId, nodeId: target.id });
      setReorderTarget(null);
      return;
    }

    const activeNode = findNode(nodes, activeId);
    const isSibling = activeNode !== undefined && activeNode.parentId === target.parentId;

    if (isSibling && dragged.length === 1) {
      const index = getChildren(nodes, target.parentId).findIndex((item) => item.id === target.id);
      setReorderTarget(index === -1 ? null : { paneId: data.paneId, index });
      setDropTarget(null);
      return;
    }

    setDropTarget(null);
    setReorderTarget(null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const activeId = String(event.active.id);
    const data = asDropData(event.over?.data.current);
    resetDragState();

    if (data === null) return;

    const ids = effectiveIds(activeId);

    if (data.kind === "crumb" || data.kind === "pane") {
      moveToFolder(ids, data.folderId);
      return;
    }

    const target = data.node;
    if (ids.includes(target.id)) return;

    if (target.type === "folder") {
      moveToFolder(ids, target.id);
      return;
    }

    const activeNode = findNode(nodes, activeId);
    const isSibling = activeNode !== undefined && activeNode.parentId === target.parentId;

    if (isSibling && ids.length === 1) {
      const index = getChildren(nodes, target.parentId).findIndex((item) => item.id === target.id);
      if (index !== -1) reorder(activeId, index);
      return;
    }

    // Dropped onto a file in another folder: land beside it.
    moveToFolder(ids, target.parentId);
  };

  const announcements = useMemo<Announcements>(
    () => ({
      onDragStart: ({ active }) => {
        const node = findNode(nodes, String(active.id));
        return node === undefined ? undefined : `Picked up ${node.name}.`;
      },
      onDragOver: ({ active, over }) => {
        const node = findNode(nodes, String(active.id));
        const data = asDropData(over?.data.current);
        if (node === undefined || data === null) return undefined;
        if (data.kind === "row") return `${node.name} is over ${data.node.name}.`;
        return `${node.name} is over ${data.folderId === null ? "Home" : "a folder"}.`;
      },
      onDragEnd: ({ active, over }) => {
        const node = findNode(nodes, String(active.id));
        if (node === undefined) return undefined;
        return over === null ? `${node.name} was dropped.` : `${node.name} was moved.`;
      },
      onDragCancel: ({ active }) => {
        const node = findNode(nodes, String(active.id));
        return node === undefined ? undefined : `Moving ${node.name} was cancelled.`;
      },
    }),
    [nodes],
  );

  const firstPaneId = panes[0]?.id;

  return (
    <div className="flex h-full min-h-0 flex-col bg-card">
      <WindowToolbar />

      <div className="flex min-h-0 flex-1">
        {firstPaneId !== undefined && <Sidebar paneId={firstPaneId} />}

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          accessibility={{ announcements, screenReaderInstructions }}
          measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          onDragCancel={resetDragState}
        >
          <PanelGroup direction="horizontal" className="min-h-0 flex-1" autoSaveId="explorer-panes">
            {panes.map((pane, index) => (
              <Fragment key={pane.id}>
                {index > 0 && (
                  <PanelResizeHandle className="w-1.5 bg-border/80 transition-colors hover:bg-primary/30 data-[resize-handle-active]:bg-primary/40" />
                )}
                <Panel
                  defaultSize={100 / panes.length}
                  minSize={20}
                  className="flex min-w-0 flex-col"
                >
                  <ExplorerPane pane={pane} canClose={panes.length > 1} />
                </Panel>
              </Fragment>
            ))}
          </PanelGroup>

          {/* Portalled to the body: the panes scroll and clip their overflow, and
              a preview rendered inside one of them can be cut off. */}
          {createPortal(
            <DragOverlay dropAnimation={null}>
              {draggedNode === undefined ? null : (
                <div
                  data-testid="drag-overlay"
                  className="flex items-center gap-2 rounded-lg border border-black/10 bg-white/95 px-3 py-2 shadow-xl backdrop-blur-sm"
                >
                  <NodeIcon node={draggedNode} />
                  <span className="max-w-52 truncate text-[13px] font-medium">
                    {draggedNode.name}
                  </span>
                  {draggedCount > 1 && (
                    <span className="rounded-full bg-primary px-1.5 py-0.5 text-[11px] text-primary-foreground">
                      {draggedCount}
                    </span>
                  )}
                </div>
              )}
            </DragOverlay>,
            document.body,
          )}
        </DndContext>
      </div>

      <footer className="flex shrink-0 items-center justify-between border-t border-black/5 bg-titlebar px-3 py-1 text-[11px] text-muted-foreground">
        <span>
          {nodes.length} items
          {requiredCount > 0 ? ` · ${String(requiredCount)} required` : ""}
        </span>
        <span>Drag to reorder · Drop on a folder to move · Required files stay put</span>
      </footer>

      <ExplorerDialogs />

      <span className="sr-only" aria-live="polite">
        {selectedIds.size > 0 ? `${String(selectedIds.size)} items selected` : ""}
      </span>
    </div>
  );
}
