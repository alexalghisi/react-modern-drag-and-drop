import { describe, expect, it } from "vitest";
import {
  collectSubtreeIds,
  compareNodes,
  filterRedundantIds,
  getBreadcrumbs,
  isDescendantOf,
  moveNodes,
  wouldCreateCycle,
} from "./tree";
import type { FileNode } from "@/types";

function node(partial: Partial<FileNode> & { id: string }): FileNode {
  return {
    name: `node-${partial.id}`,
    type: "file",
    parentId: null,
    order: 0,
    updatedAt: "Jan 1, 2024",
    ...partial,
  };
}

/**
 * A deliberately deep, wide tree used to exercise multi-level traversal.
 *
 * root
 * └── a (folder)
 *     └── b (folder)
 *         └── c (folder)
 *             ├── leaf1
 *             └── leaf2
 */
const deep: FileNode[] = [
  node({ id: "a", name: "a", type: "folder", order: 0 }),
  node({ id: "b", name: "b", type: "folder", parentId: "a", order: 0 }),
  node({ id: "c", name: "c", type: "folder", parentId: "b", order: 0 }),
  node({ id: "leaf1", name: "leaf1.txt", parentId: "c", order: 0 }),
  node({ id: "leaf2", name: "leaf2.txt", parentId: "c", order: 1 }),
];

describe("compareNodes", () => {
  it("orders by explicit order before anything else", () => {
    const a = node({ id: "a", type: "folder", order: 5 });
    const b = node({ id: "b", type: "file", order: 1 });
    expect(compareNodes(a, b)).toBeGreaterThan(0);
  });

  it("breaks an order tie by putting folders first", () => {
    const folder = node({ id: "f", type: "folder", order: 0 });
    const file = node({ id: "x", type: "file", order: 0 });
    expect(compareNodes(folder, file)).toBeLessThan(0);
    expect(compareNodes(file, folder)).toBeGreaterThan(0);
  });

  it("breaks a same-type tie alphabetically by name", () => {
    const alpha = node({ id: "1", name: "alpha.txt", order: 0 });
    const beta = node({ id: "2", name: "beta.txt", order: 0 });
    expect(compareNodes(alpha, beta)).toBeLessThan(0);
  });
});

describe("deep traversal", () => {
  it("resolves breadcrumbs through several levels", () => {
    expect(getBreadcrumbs(deep, "c").map((c) => c.id)).toEqual(["a", "b", "c"]);
  });

  it("detects a descendant many levels down", () => {
    expect(isDescendantOf(deep, "leaf1", "a")).toBe(true);
    expect(isDescendantOf(deep, "leaf1", "b")).toBe(true);
  });

  it("blocks a deep folder from being dropped into its own descendant", () => {
    expect(wouldCreateCycle(deep, ["a"], "c")).toBe(true);
    expect(moveNodes(deep, ["a"], "c")).toBe(deep);
  });

  it("collects an entire multi-level subtree", () => {
    expect(collectSubtreeIds(deep, ["a"])).toEqual(new Set(["a", "b", "c", "leaf1", "leaf2"]));
  });
});

describe("filterRedundantIds across levels", () => {
  it("drops every descendant when a distant ancestor is selected", () => {
    expect(filterRedundantIds(deep, ["a", "c", "leaf1", "leaf2"])).toEqual(["a"]);
  });

  it("keeps the deepest common ancestor only", () => {
    expect(filterRedundantIds(deep, ["b", "leaf1"])).toEqual(["b"]);
  });

  it("preserves order of the surviving ids", () => {
    expect(filterRedundantIds(deep, ["leaf2", "leaf1"])).toEqual(["leaf2", "leaf1"]);
  });
});

describe("cycle-safe against malformed data", () => {
  const cyclic: FileNode[] = [
    node({ id: "x", type: "folder", parentId: "y" }),
    node({ id: "y", type: "folder", parentId: "x" }),
  ];

  it("does not loop forever building breadcrumbs", () => {
    expect(getBreadcrumbs(cyclic, "x").length).toBeLessThanOrEqual(2);
  });

  it("does not loop forever checking descendants", () => {
    expect(isDescendantOf(cyclic, "x", "z")).toBe(false);
  });

  it("does not loop forever filtering redundant ids", () => {
    expect(filterRedundantIds(cyclic, ["x", "y"])).toEqual([]);
  });

  it("does not loop forever collecting a cyclic subtree", () => {
    expect(collectSubtreeIds(cyclic, ["x"])).toEqual(new Set(["x", "y"]));
  });
});
