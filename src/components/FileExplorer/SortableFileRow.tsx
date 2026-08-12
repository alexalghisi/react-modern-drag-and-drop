import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { FileRow, type FileRowProps } from "./FileRow";
import type { DropData } from "./dnd";

type SortableFileRowProps = Omit<FileRowProps, "dragHandleProps" | "isDragging">;

export function SortableFileRow(props: SortableFileRowProps) {
  const data: DropData = { kind: "row", node: props.node, paneId: props.paneId };
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: props.node.id,
    data,
    // The whole row is the drag handle, but it also holds real buttons. Left as
    // dnd-kit's default role="button" it would nest buttons inside a button and
    // absorb their labels into its own accessible name; "group" keeps the row
    // focusable and draggable without claiming to be a control.
    attributes: { role: "group", roleDescription: "draggable row" },
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className="touch-none"
    >
      <FileRow
        {...props}
        dragHandleProps={{ ...attributes, ...listeners }}
        isDragging={isDragging}
      />
    </div>
  );
}
