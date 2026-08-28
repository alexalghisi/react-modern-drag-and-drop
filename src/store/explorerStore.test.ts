import { beforeEach, describe, expect, it, vi } from "vitest";
import { useExplorerStore } from "./explorerStore";
import { getChildren } from "@/lib/tree";
import { SEED_NODES } from "@/lib/seed";
import type { FileNode } from "@/types";

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const { toast } = await import("sonner");

function reset() {
  useExplorerStore.setState({
    nodes: SEED_NODES,
    panes: [{ id: "p0", folderId: null }],
    selectedIds: new Set<string>(),
    draggedId: null,
    dropTarget: null,
    reorderTarget: null,
    dialog: null,
    lastClick: null,
    moveDestination: "root",
  });
}

const store = () => useExplorerStore.getState();
const idsOf = (nodes: FileNode[]) => nodes.map((item) => item.id);

beforeEach(() => {
  reset();
  vi.clearAllMocks();
});

describe("selection", () => {
  const items = () => getChildren(store().nodes, null);

  it("replaces the selection on a plain click", () => {
    const list = items();
    store().selectRow(list[0]!, 0, {}, list, "p0");
    store().selectRow(list[1]!, 1, {}, list, "p0");
    expect([...store().selectedIds]).toEqual([list[1]!.id]);
  });

  it("toggles with the meta key", () => {
    const list = items();
    store().selectRow(list[0]!, 0, { metaKey: true }, list, "p0");
    store().selectRow(list[1]!, 1, { metaKey: true }, list, "p0");
    expect(store().selectedIds.size).toBe(2);

    store().selectRow(list[1]!, 1, { metaKey: true }, list, "p0");
    expect([...store().selectedIds]).toEqual([list[0]!.id]);
  });

  it("extends a range with the shift key", () => {
    const list = items();
    store().selectRow(list[0]!, 0, {}, list, "p0");
    store().selectRow(list[2]!, 2, { shiftKey: true }, list, "p0");
    expect(store().selectedIds).toEqual(new Set(idsOf(list.slice(0, 3))));
  });

  it("ignores a shift range that started in another pane", () => {
    const list = items();
    store().selectRow(list[0]!, 0, {}, list, "p0");
    store().selectRow(list[3]!, 3, { shiftKey: true }, list, "p1");
    expect([...store().selectedIds]).toEqual([list[3]!.id]);
  });

  it("selects and clears every row", () => {
    const list = items();
    store().selectAll(true, list);
    expect(store().selectedIds.size).toBe(list.length);
    store().selectAll(false, list);
    expect(store().selectedIds.size).toBe(0);
  });
});

describe("effectiveIds", () => {
  it("returns the whole selection when the row is part of it", () => {
    useExplorerStore.setState({ selectedIds: new Set(["1", "2"]) });
    expect(store().effectiveIds("1").sort()).toEqual(["1", "2"]);
  });

  it("returns only the row when it sits outside the selection", () => {
    useExplorerStore.setState({ selectedIds: new Set(["1", "2"]) });
    expect(store().effectiveIds("7")).toEqual(["7"]);
  });

  it("returns the row when it is the sole selection", () => {
    useExplorerStore.setState({ selectedIds: new Set(["1"]) });
    expect(store().effectiveIds("1")).toEqual(["1"]);
  });
});

describe("createNode", () => {
  it("appends a folder to the open directory", () => {
    store().openDialog({ kind: "create", parentId: "1", nodeType: "folder" });
    store().createNode("Reports");

    const created = getChildren(store().nodes, "1").at(-1);
    expect(created?.name).toBe("Reports");
    expect(created?.type).toBe("folder");
    expect(created?.size).toBeUndefined();
    expect(store().dialog).toBeNull();
  });

  it("gives files a placeholder size", () => {
    store().openDialog({ kind: "create", parentId: null, nodeType: "file" });
    store().createNode("todo.md");
    expect(getChildren(store().nodes, null).at(-1)?.size).toBe("0 KB");
  });

  it("rejects a blank name", () => {
    store().openDialog({ kind: "create", parentId: null, nodeType: "file" });
    const before = store().nodes.length;
    store().createNode("   ");
    expect(store().nodes.length).toBe(before);
  });
});

describe("submitRename", () => {
  it("trims and applies the new name", () => {
    const target = store().nodes.find((item) => item.id === "7")!;
    store().openDialog({ kind: "rename", node: target });
    store().submitRename("  CHANGELOG.md  ");

    expect(store().nodes.find((item) => item.id === "7")?.name).toBe("CHANGELOG.md");
    expect(store().dialog).toBeNull();
  });

  it("ignores an empty name", () => {
    const target = store().nodes.find((item) => item.id === "7")!;
    store().openDialog({ kind: "rename", node: target });
    store().submitRename("");
    expect(store().nodes.find((item) => item.id === "7")?.name).toBe("README.md");
  });
});

describe("deleteNodes", () => {
  it("removes a folder together with its contents", () => {
    store().deleteNodes(["2"]);
    const remaining = new Set(idsOf(store().nodes));
    for (const id of ["2", "5", "15"]) {
      expect(remaining.has(id)).toBe(false);
    }
  });

  it("drops deleted ids from the selection", () => {
    useExplorerStore.setState({ selectedIds: new Set(["13", "16"]) });
    store().deleteNodes(["13"]);
    expect([...store().selectedIds]).toEqual(["16"]);
  });

  it("refuses to delete a required file", () => {
    const before = store().nodes.length;
    store().deleteNodes(["7"]);
    expect(store().nodes).toHaveLength(before);
    expect(store().nodes.find((item) => item.id === "7")).toBeDefined();
    expect(toast.error).toHaveBeenCalled();
  });

  it("refuses to delete a folder that contains a required file", () => {
    store().deleteNodes(["1"]);
    expect(store().nodes.find((item) => item.id === "1")).toBeDefined();
    expect(store().nodes.find((item) => item.id === "14")).toBeDefined();
    expect(toast.error).toHaveBeenCalled();
  });

  it("deletes the rest of a mixed selection", () => {
    store().deleteNodes(["7", "13"]);
    expect(store().nodes.find((item) => item.id === "7")).toBeDefined();
    expect(store().nodes.find((item) => item.id === "13")).toBeUndefined();
  });
});

describe("moveToFolder", () => {
  it("reparents the node", () => {
    store().moveToFolder(["13"], "1");
    expect(store().nodes.find((item) => item.id === "13")?.parentId).toBe("1");
    expect(toast.success).toHaveBeenCalled();
  });

  it("refuses to move a folder into its own subfolder and warns", () => {
    const before = store().nodes;
    store().moveToFolder(["1"], "3");
    expect(store().nodes).toBe(before);
    expect(toast.error).toHaveBeenCalledWith("Cannot move a folder into its own subfolder");
  });

  it("does nothing when the target is the dragged node itself", () => {
    const before = store().nodes;
    store().moveToFolder(["1"], "1");
    expect(store().nodes).toBe(before);
  });

  it("clears the moved ids from the selection", () => {
    useExplorerStore.setState({ selectedIds: new Set(["13", "16"]) });
    store().moveToFolder(["13", "16"], "1");
    expect(store().selectedIds.size).toBe(0);
  });

  it("refuses to move a required file out of its folder", () => {
    store().moveToFolder(["7"], "1");
    expect(store().nodes.find((item) => item.id === "7")?.parentId).toBeNull();
    expect(toast.error).toHaveBeenCalledWith("Required files must stay in their folder");
  });
});

describe("reorder", () => {
  it("moves a row to the requested index", () => {
    const before = idsOf(getChildren(store().nodes, null));
    store().reorder(before[3]!, 0);
    expect(idsOf(getChildren(store().nodes, null))[0]).toBe(before[3]);
  });
});

describe("submitMove", () => {
  it("moves the dialog selection to the chosen folder", () => {
    const primary = store().nodes.find((item) => item.id === "13")!;
    store().openDialog({ kind: "move", nodeIds: ["13"], primary });
    store().setMoveDestination("10");
    store().submitMove();

    expect(store().nodes.find((item) => item.id === "13")?.parentId).toBe("10");
    expect(store().dialog).toBeNull();
  });

  it("maps the root sentinel to a null parent", () => {
    const primary = store().nodes.find((item) => item.id === "4")!;
    store().openDialog({ kind: "move", nodeIds: ["4"], primary });
    store().setMoveDestination("root");
    store().submitMove();

    expect(store().nodes.find((item) => item.id === "4")?.parentId).toBeNull();
  });
});

describe("setMandatory", () => {
  it("marks a file as required", () => {
    store().setMandatory("13", true);
    expect(store().nodes.find((item) => item.id === "13")?.mandatory).toBe(true);
  });

  it("ignores folders", () => {
    store().setMandatory("1", true);
    expect(store().nodes.find((item) => item.id === "1")?.mandatory).toBeUndefined();
  });
});

describe("panes", () => {
  it("adds a pane rooted at home", () => {
    store().addPane();
    expect(store().panes).toHaveLength(2);
    expect(store().panes[1]?.folderId).toBeNull();
  });

  it("never removes the last pane", () => {
    store().removePane("p0");
    expect(store().panes).toHaveLength(1);
  });

  it("clears the selection when navigating", () => {
    useExplorerStore.setState({ selectedIds: new Set(["7"]) });
    store().openFolder("p0", "1");
    expect(store().selectedIds.size).toBe(0);
    expect(store().panes[0]?.folderId).toBe("1");
  });
});
