import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FileExplorer } from "./FileExplorer";
import { useExplorerStore } from "@/store/explorerStore";
import { SEED_NODES } from "@/lib/seed";

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
  Toaster: () => null,
}));

beforeEach(() => {
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
});

describe("FileExplorer", () => {
  it("lists the contents of the root folder", () => {
    render(<FileExplorer />);
    expect(screen.getByTestId("row-folder-1")).toHaveTextContent("Documents");
    expect(screen.getByTestId("row-file-7")).toHaveTextContent("README.md");
  });

  it("navigates into a folder on double click", async () => {
    const user = userEvent.setup();
    render(<FileExplorer />);

    await user.dblClick(screen.getByTestId("row-folder-1"));

    expect(screen.getByTestId("row-file-4")).toHaveTextContent("Budget_2024.xlsx");
    expect(screen.queryByTestId("row-file-7")).not.toBeInTheDocument();
    expect(
      within(screen.getByRole("navigation", { name: "Breadcrumb" })).getByText("Documents"),
    ).toBeVisible();
  });

  it("selects a row on click and reports the count", async () => {
    const user = userEvent.setup();
    render(<FileExplorer />);

    await user.click(screen.getByTestId("row-file-7"));

    expect(useExplorerStore.getState().selectedIds).toEqual(new Set(["7"]));
    expect(screen.getByText("1 items selected")).toBeInTheDocument();
  });

  it("creates a folder through the dialog", async () => {
    const user = userEvent.setup();
    render(<FileExplorer />);

    await user.click(screen.getByRole("button", { name: /folder/i }));
    await user.type(screen.getByTestId("input-create"), "Invoices");
    await user.click(screen.getByTestId("button-create-submit"));

    expect(screen.getAllByText("Invoices").length).toBeGreaterThanOrEqual(1);
  });

  it("rejects an empty name and keeps the dialog open", async () => {
    const user = userEvent.setup();
    render(<FileExplorer />);

    await user.click(screen.getByRole("button", { name: /folder/i }));
    await user.click(screen.getByTestId("button-create-submit"));

    expect(await screen.findByRole("alert")).toHaveTextContent("Name is required");
    expect(screen.getByTestId("input-create")).toBeVisible();
  });

  it("shows a required badge on mandatory files", () => {
    render(<FileExplorer />);
    expect(screen.getByTestId("row-file-7")).toHaveAttribute("data-mandatory", "true");
    expect(screen.getByTestId("row-file-7")).toHaveTextContent("Required");
  });

  it("opens a second pane", async () => {
    const user = userEvent.setup();
    render(<FileExplorer />);

    await user.click(screen.getByTestId("button-add-pane"));

    expect(useExplorerStore.getState().panes).toHaveLength(2);
  });

  it("deletes a selected file from the keyboard", async () => {
    const user = userEvent.setup();
    render(<FileExplorer />);

    await user.click(screen.getByTestId("row-file-13"));
    await user.keyboard("{Delete}");

    expect(screen.queryByTestId("row-file-13")).not.toBeInTheDocument();
  });

  it("does not delete a required file from the keyboard", async () => {
    const user = userEvent.setup();
    render(<FileExplorer />);

    await user.click(screen.getByTestId("row-file-7"));
    await user.keyboard("{Delete}");

    expect(screen.getByTestId("row-file-7")).toBeInTheDocument();
  });
});
