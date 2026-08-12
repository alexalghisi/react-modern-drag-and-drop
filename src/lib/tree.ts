import type { FileNode } from "@/types";

/**
 * Folders first, then by explicit order, then alphabetically. Used for every
 * rendered list so that the visual order and the persisted `order` agree.
 */
export function compareNodes(a: FileNode, b: FileNode): number {
  if (a.order !== b.order) return a.order - b.order;
  if (a.type === b.type) return a.name.localeCompare(b.name);
  return a.type === "folder" ? -1 : 1;
}

export function getChildren(nodes: FileNode[], parentId: string | null): FileNode[] {
  return nodes.filter((node) => node.parentId === parentId).sort(compareNodes);
}

export function getAllFolders(nodes: FileNode[]): FileNode[] {
  return nodes.filter((node) => node.type === "folder");
}

export function findNode(nodes: FileNode[], id: string | null): FileNode | undefined {
  if (id === null) return undefined;
  return nodes.find((node) => node.id === id);
}

/**
 * Walks from `folderId` up to the root. Guards against malformed data
 * containing a parent cycle, which would otherwise hang the render.
 */
export function getBreadcrumbs(nodes: FileNode[], folderId: string | null): FileNode[] {
  const crumbs: FileNode[] = [];
  const seen = new Set<string>();
  let current = folderId;

  while (current !== null && !seen.has(current)) {
    seen.add(current);
    const folder = findNode(nodes, current);
    if (!folder) break;
    crumbs.unshift(folder);
    current = folder.parentId;
  }

  return crumbs;
}

/** True when `descendantId` sits anywhere beneath `ancestorId`. */
export function isDescendantOf(
  nodes: FileNode[],
  descendantId: string | null,
  ancestorId: string,
): boolean {
  const seen = new Set<string>();
  let current = descendantId;

  while (current !== null && !seen.has(current)) {
    if (current === ancestorId) return true;
    seen.add(current);
    current = findNode(nodes, current)?.parentId ?? null;
  }

  return false;
}

/**
 * A folder may not be dropped into itself or into any of its own descendants.
 * Returns true when the move must be rejected.
 */
export function wouldCreateCycle(
  nodes: FileNode[],
  draggedIds: string[],
  targetFolderId: string | null,
): boolean {
  return draggedIds.some((draggedId) => isDescendantOf(nodes, targetFolderId, draggedId));
}

/**
 * Drops ids whose ancestor is already part of the same selection. Moving a
 * folder already moves its children, so carrying both would double-apply.
 */
export function filterRedundantIds(nodes: FileNode[], ids: string[]): string[] {
  const selected = new Set(ids);

  return ids.filter((id) => {
    let parent = findNode(nodes, id)?.parentId ?? null;
    const seen = new Set<string>();

    while (parent !== null && !seen.has(parent)) {
      if (selected.has(parent)) return false;
      seen.add(parent);
      parent = findNode(nodes, parent)?.parentId ?? null;
    }

    return true;
  });
}

/** Every id in `ids` plus the full subtree underneath each of them. */
export function collectSubtreeIds(nodes: FileNode[], ids: string[]): Set<string> {
  const result = new Set<string>(ids);
  const queue = [...ids];

  while (queue.length > 0) {
    const parentId = queue.pop();
    if (parentId === undefined) continue;
    for (const node of nodes) {
      if (node.parentId === parentId && !result.has(node.id)) {
        result.add(node.id);
        queue.push(node.id);
      }
    }
  }

  return result;
}

/** Renumbers `order` densely from 0 following the given sequence. */
function applyOrder(nodes: FileNode[], sequence: FileNode[], parentId: string | null): FileNode[] {
  const orderById = new Map(sequence.map((node, index) => [node.id, index]));

  return nodes.map((node) => {
    const order = orderById.get(node.id);
    if (order === undefined) return node;
    return { ...node, parentId, order };
  });
}

/** Moves `draggedId` to `targetIndex` among its siblings. */
export function reorderWithinFolder(
  nodes: FileNode[],
  draggedId: string,
  targetIndex: number,
): FileNode[] {
  const dragged = findNode(nodes, draggedId);
  if (!dragged) return nodes;

  const siblings = getChildren(nodes, dragged.parentId).filter((node) => node.id !== draggedId);
  const index = Math.max(0, Math.min(targetIndex, siblings.length));
  siblings.splice(index, 0, dragged);

  return applyOrder(nodes, siblings, dragged.parentId);
}

/**
 * Reparents `ids` under `newParentId`, inserting at `index` (append when
 * omitted). Rejects moves that would detach a folder into its own subtree.
 */
export function moveNodes(
  nodes: FileNode[],
  ids: string[],
  newParentId: string | null,
  index?: number,
): FileNode[] {
  if (ids.length === 0) return nodes;
  if (wouldCreateCycle(nodes, ids, newParentId)) return nodes;

  const moving = filterRedundantIds(nodes, ids);
  const movingSet = new Set(moving);
  const movedNodes = moving
    .map((id) => findNode(nodes, id))
    .filter((node): node is FileNode => node !== undefined);

  if (movedNodes.length === 0) return nodes;

  const remaining = getChildren(nodes, newParentId).filter((node) => !movingSet.has(node.id));
  const insertAt =
    index === undefined ? remaining.length : Math.max(0, Math.min(index, remaining.length));
  remaining.splice(insertAt, 0, ...movedNodes);

  return applyOrder(nodes, remaining, newParentId);
}

/** Removes `ids` together with everything nested beneath them. */
export function removeNodes(nodes: FileNode[], ids: string[]): FileNode[] {
  const doomed = collectSubtreeIds(nodes, ids);
  return nodes.filter((node) => !doomed.has(node.id));
}

export function renameNode(nodes: FileNode[], id: string, name: string): FileNode[] {
  return nodes.map((node) => (node.id === id ? { ...node, name } : node));
}

/** Next free `order` value inside `parentId`. */
export function nextOrder(nodes: FileNode[], parentId: string | null): number {
  const siblings = nodes.filter((node) => node.parentId === parentId);
  if (siblings.length === 0) return 0;
  return Math.max(...siblings.map((node) => node.order)) + 1;
}
