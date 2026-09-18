import { describe, expect, it } from "vitest";
import { getChildren, moveNodes, nextOrder, reorderWithinFolder } from "./tree";
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

/** A single folder holding four files with sparse, non-contiguous orders. */
const sparse: FileNode[] = [
  node({ id: "bin", name: "bin", type: "folder", order: 0 }),
  node({ id: "one", name: "one.txt", parentId: "bin", order: 3 }),
  node({ id: "two", name: "two.txt", parentId: "bin", order: 7 }),
  node({ id: "three", name: "three.txt", parentId: "bin", order: 11 }),
  node({ id: "four", name: "four.txt", parentId: "bin", order: 40 }),
];

describe("dense renumbering", () => {
  it("collapses sparse orders to 0..n-1 after a reorder", () => {
    const result = reorderWithinFolder(sparse, "four", 0);
    expect(getChildren(result, "bin").map((c) => c.id)).toEqual(["four", "one", "two", "three"]);
    expect(getChildren(result, "bin").map((c) => c.order)).toEqual([0, 1, 2, 3]);
  });

  it("renumbers the destination folder densely after a move", () => {
    const result = moveNodes(sparse, ["two"], null);
    expect(getChildren(result, null).map((c) => c.id)).toEqual(["bin", "two"]);
    expect(getChildren(result, null).map((c) => c.order)).toEqual([0, 1]);
  });

  it("leaves the source folder's relative order correct even if sparse", () => {
    const result = moveNodes(sparse, ["two"], null);
    // Ordering is relative, so the source is not re-densified; the surviving
    // siblings still render in their original sequence.
    expect(getChildren(result, "bin").map((c) => c.id)).toEqual(["one", "three", "four"]);
  });
});

describe("index clamping", () => {
  it("clamps a negative target index to the front", () => {
    const result = reorderWithinFolder(sparse, "three", -5);
    expect(getChildren(result, "bin").map((c) => c.id)[0]).toBe("three");
  });

  it("clamps an oversized move index to the end", () => {
    const result = moveNodes(sparse, ["four"], null, 999);
    expect(getChildren(result, null).map((c) => c.id)).toEqual(["bin", "four"]);
  });
});

describe("nextOrder on sparse data", () => {
  it("continues one past the highest existing sibling order", () => {
    expect(nextOrder(sparse, "bin")).toBe(41);
  });

  it("is zero for a folder with no children", () => {
    expect(nextOrder(sparse, "one")).toBe(0);
  });
});
