import {
  File as FileIcon,
  FileArchive,
  FileSpreadsheet,
  FileText,
  Image,
  Presentation,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { FileNode } from "@/types";

const FOLDER_FILL = "#5AC8FA";
const FOLDER_STROKE = "#0A84FF";

interface NodeIconProps {
  node: FileNode;
  className?: string;
}

function extensionOf(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot === -1 ? "" : name.slice(dot + 1).toLowerCase();
}

export function NodeIcon({ node, className }: NodeIconProps) {
  if (node.type === "folder") {
    return (
      <svg viewBox="0 0 24 24" className={cn("h-5 w-5 shrink-0", className)} aria-hidden>
        <path
          d="M3.5 7.5A2 2 0 0 1 5.5 5.5h4.2l1.6 2H18.5A2 2 0 0 1 20.5 9.5v8A2 2 0 0 1 18.5 19.5h-13A2 2 0 0 1 3.5 17.5v-10Z"
          fill={FOLDER_FILL}
          stroke={FOLDER_STROKE}
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  const ext = extensionOf(node.name);
  const shared = cn("h-5 w-5 shrink-0", className);

  if (["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext)) {
    return <Image className={cn(shared, "text-violet-500")} />;
  }
  if (["xls", "xlsx", "csv"].includes(ext)) {
    return <FileSpreadsheet className={cn(shared, "text-emerald-600")} />;
  }
  if (["ppt", "pptx"].includes(ext)) {
    return <Presentation className={cn(shared, "text-orange-500")} />;
  }
  if (["zip", "tar", "gz"].includes(ext)) {
    return <FileArchive className={cn(shared, "text-amber-600")} />;
  }
  if (["md", "txt", "pdf", "docx", "json"].includes(ext)) {
    return <FileText className={cn(shared, "text-sky-700")} />;
  }

  return <FileIcon className={cn(shared, "text-muted-foreground")} />;
}
