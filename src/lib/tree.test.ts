import { describe, expect, it } from "vitest";
import {
  collectSubtreeIds,
  filterRedundantIds,
  getBreadcrumbs,
  getChildren,
  isDescendantOf,
  moveNodes,
  nextOrder,
  removeNodes,
  reorderWithinFolder,
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
 * root
 * ├── docs (folder)
 * │   ├── work (folder)
 * │   │   └── deep.txt
 * │   └── budget.xlsx
 * └── notes.md
 */
const tree: FileNode[] = [
  node({ id: "docs", name: "docs", type: "folder", order: 0 }),
  node({ id: "notes", name: "notes.md", order: 1 }),
  node({ id: "work", name: "work", type: "folder", parentId: "docs", order: 0 }),
  node({ id: "budget", name: "budget.xlsx", parentId: "docs", order: 1 }),
  node({ id: "deep", name: "deep.txt", parentId: "work", order: 0 }),
];

describe("getChildren", () => {
  it("returns direct children in order", () => {
    expect(getChildren(tree, null).map((child) => child.id)).toEqual(["docs", "notes"]);
    expect(getChildren(tree, "docs").map((child) => child.id)).toEqual(["work", "budget"]);
  });

  it("sorts folders before files when order ties", () => {
    const tied = [
      node({ id: "f", name: "zeta.txt", type: "file", order: 0 }),
      node({ id: "d", name: "alpha", type: "folder", order: 0 }),
    ];
    expect(getChildren(tied, null).map((child) => child.id)).toEqual(["d", "f"]);
  });

  it("returns an empty list for a leaf", () => {
    expect(getChildren(tree, "deep")).toEqual([]);
  });
});

describe("getBreadcrumbs", () => {
  it("builds the path from root down to the folder", () => {
    expect(getBreadcrumbs(tree, "work").map((crumb) => crumb.id)).toEqual(["docs", "work"]);
  });

  it("is empty at the root", () => {
    expect(getBreadcrumbs(tree, null)).toEqual([]);
  });

  it("does not hang on a parent cycle", () => {
    const cyclic: FileNode[] = [
      node({ id: "a", type: "folder", parentId: "b" }),
      node({ id: "b", type: "folder", parentId: "a" }),
    ];
    expect(getBreadcrumbs(cyclic, "a").length).toBeLessThanOrEqual(2);
  });
});

describe("isDescendantOf", () => {
  it("detects nested descendants", () => {
    expect(isDescendantOf(tree, "deep", "docs")).toBe(true);
    expect(isDescendantOf(tree, "work", "docs")).toBe(true);
  });

  it("treats a node as its own ancestor", () => {
    expect(isDescendantOf(tree, "docs", "docs")).toBe(true);
  });

  it("rejects unrelated nodes", () => {
    expect(isDescendantOf(tree, "notes", "docs")).toBe(false);
    expect(isDescendantOf(tree, null, "docs")).toBe(false);
  });
});

describe("wouldCreateCycle", () => {
  it("blocks dropping a folder into its own subtree", () => {
    expect(wouldCreateCycle(tree, ["docs"], "work")).toBe(true);
    expect(wouldCreateCycle(tree, ["docs"], "docs")).toBe(true);
  });

  it("allows unrelated destinations", () => {
    expect(wouldCreateCycle(tree, ["notes"], "work")).toBe(false);
    expect(wouldCreateCycle(tree, ["work"], null)).toBe(false);
  });
});

describe("filterRedundantIds", () => {
  it("drops children whose ancestor is also selected", () => {
    expect(filterRedundantIds(tree, ["docs", "work", "deep"])).toEqual(["docs"]);
  });

  it("keeps independent selections", () => {
    expect(filterRedundantIds(tree, ["notes", "budget"])).toEqual(["notes", "budget"]);
  });
});

describe("collectSubtreeIds", () => {
  it("includes every nested descendant", () => {
    expect(collectSubtreeIds(tree, ["docs"])).toEqual(new Set(["docs", "work", "budget", "deep"]));
  });

  it("returns just the node for a leaf", () => {
    expect(collectSubtreeIds(tree, ["notes"])).toEqual(new Set(["notes"]));
  });
});

describe("reorderWithinFolder", () => {
  it("moves an item down and renumbers densely", () => {
    const result = reorderWithinFolder(tree, "work", 1);
    expect(getChildren(result, "docs").map((child) => child.id)).toEqual(["budget", "work"]);
    expect(getChildren(result, "docs").map((child) => child.order)).toEqual([0, 1]);
  });

  it("clamps an out-of-range index", () => {
    const result = reorderWithinFolder(tree, "budget", 99);
    expect(getChildren(result, "docs").map((child) => child.id)).toEqual(["work", "budget"]);
  });

  it("leaves the tree untouched for an unknown id", () => {
    expect(reorderWithinFolder(tree, "missing", 0)).toBe(tree);
  });
});

describe("moveNodes", () => {
  it("reparents a file and appends it", () => {
    const result = moveNodes(tree, ["notes"], "work");
    expect(getChildren(result, "work").map((child) => child.id)).toEqual(["deep", "notes"]);
    expect(getChildren(result, null).map((child) => child.id)).toEqual(["docs"]);
  });

  it("inserts at an explicit index", () => {
    const result = moveNodes(tree, ["notes"], "docs", 0);
    expect(getChildren(result, "docs").map((child) => child.id)).toEqual([
      "notes",
      "work",
      "budget",
    ]);
    expect(getChildren(result, "docs").map((child) => child.order)).toEqual([0, 1, 2]);
  });

  it("refuses to move a folder into its own descendant", () => {
    expect(moveNodes(tree, ["docs"], "work")).toBe(tree);
  });

  it("ignores descendants that travel with their parent", () => {
    const result = moveNodes(tree, ["docs", "deep"], null);
    expect(getChildren(result, "work").map((child) => child.id)).toEqual(["deep"]);
  });

  it("is a no-op for an empty selection", () => {
    expect(moveNodes(tree, [], "docs")).toBe(tree);
  });
});

describe("removeNodes", () => {
  it("deletes the whole subtree", () => {
    const result = removeNodes(tree, ["docs"]);
    expect(result.map((item) => item.id)).toEqual(["notes"]);
  });

  it("deletes a single leaf", () => {
    expect(removeNodes(tree, ["notes"]).map((item) => item.id)).toEqual([
      "docs",
      "work",
      "budget",
      "deep",
    ]);
  });
});

describe("nextOrder", () => {
  it("continues after the highest sibling", () => {
    expect(nextOrder(tree, "docs")).toBe(2);
  });

  it("starts at zero in an empty folder", () => {
    expect(nextOrder(tree, "deep")).toBe(0);
  });
});
