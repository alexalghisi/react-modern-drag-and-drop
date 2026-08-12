import type { FileNode } from "@/types";

/** Deterministic demo tree, deep enough to exercise nesting and cycle guards. */
export const SEED_NODES: FileNode[] = [
  {
    id: "1",
    name: "Documents",
    type: "folder",
    parentId: null,
    order: 0,
    updatedAt: "Oct 25, 2023",
  },
  { id: "2", name: "Images", type: "folder", parentId: null, order: 1, updatedAt: "Oct 26, 2023" },
  {
    id: "10",
    name: "Design_System",
    type: "folder",
    parentId: null,
    order: 2,
    updatedAt: "Nov 3, 2023",
  },
  {
    id: "7",
    name: "README.md",
    type: "file",
    parentId: null,
    order: 3,
    size: "12 KB",
    updatedAt: "Oct 31, 2023",
  },
  {
    id: "13",
    name: "Presentation_Q4.pptx",
    type: "file",
    parentId: null,
    order: 4,
    size: "8.7 MB",
    updatedAt: "Nov 4, 2023",
  },
  {
    id: "16",
    name: "Database_Backup.zip",
    type: "file",
    parentId: null,
    order: 5,
    size: "156 MB",
    updatedAt: "Nov 7, 2023",
  },

  { id: "3", name: "Work", type: "folder", parentId: "1", order: 0, updatedAt: "Oct 27, 2023" },
  {
    id: "4",
    name: "Budget_2024.xlsx",
    type: "file",
    parentId: "1",
    order: 1,
    size: "2.4 MB",
    updatedAt: "Oct 28, 2023",
  },
  {
    id: "8",
    name: "Project_Proposal.docx",
    type: "file",
    parentId: "1",
    order: 2,
    size: "1.8 MB",
    updatedAt: "Nov 1, 2023",
  },
  {
    id: "14",
    name: "Invoice_2024-11.pdf",
    type: "file",
    parentId: "1",
    order: 3,
    size: "1.2 MB",
    updatedAt: "Nov 5, 2023",
  },

  {
    id: "5",
    name: "Vacation_Hero.jpg",
    type: "file",
    parentId: "2",
    order: 0,
    size: "4.1 MB",
    updatedAt: "Oct 29, 2023",
  },
  {
    id: "15",
    name: "Screenshot_Nov.png",
    type: "file",
    parentId: "2",
    order: 1,
    size: "2.8 MB",
    updatedAt: "Nov 6, 2023",
  },

  {
    id: "6",
    name: "App_Mockup.fig",
    type: "file",
    parentId: "3",
    order: 0,
    size: "15.2 MB",
    updatedAt: "Oct 30, 2023",
  },
  {
    id: "9",
    name: "Meeting_Notes.txt",
    type: "file",
    parentId: "3",
    order: 1,
    size: "45 KB",
    updatedAt: "Nov 2, 2023",
  },

  {
    id: "11",
    name: "Colors.json",
    type: "file",
    parentId: "10",
    order: 0,
    size: "2.1 KB",
    updatedAt: "Nov 3, 2023",
  },
  {
    id: "12",
    name: "Typography.json",
    type: "file",
    parentId: "10",
    order: 1,
    size: "3.4 KB",
    updatedAt: "Nov 3, 2023",
  },
];

export function formatToday(): string {
  return new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
