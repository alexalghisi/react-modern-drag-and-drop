# Architecture

This document explains how the explorer is structured and why. The guiding
principle is a strict separation between a **pure, framework-agnostic core** and
a **thin, typed UI adapter**. Every non-trivial rule about how the file tree may
change lives in the core, where it can be reasoned about and tested in
isolation, with no React, no DOM, and no store in the way.

## Layers

```
src/
  lib/        Pure functions. No React, no side effects. The source of truth
              for every tree invariant.
  store/      Zustand store. Orchestrates intents (select, move, rename,
              delete) by delegating the actual mutations to lib/.
  components/ Presentational + interaction layer. Reads derived state and
              dispatches intents. Holds no business rules.
  types.ts    The shared domain vocabulary (FileNode, Pane, DropTarget, ...).
```

### 1. Pure core (`src/lib/tree.ts`)

The core operates on plain `FileNode[]` snapshots and returns new snapshots. It
never mutates its inputs, never reaches for global state, and never throws for
user-reachable conditions — invalid operations are rejected by returning the
input unchanged. This makes every rule a total function that is trivial to unit
test and impossible to accidentally couple to the UI.

Key operations:

- `getChildren` / `compareNodes` — the single ordering rule (folders first,
  then explicit `order`, then name). The rendered order and the persisted
  `order` field are guaranteed to agree because both flow through here.
- `moveNodes` — reparents a selection, densely renumbering `order`. Delegates
  cycle detection and redundant-id filtering so a folder is never dropped into
  its own subtree and a moved folder never double-applies its children.
- `reorderWithinFolder` — in-place sibling reordering with clamped indices.
- `removeNodes` — deletes a selection together with its full subtree.
- `renameNode` / `setNodeMandatory` — targeted single-node updates.

### 2. Store (`src/store/explorerStore.ts`)

The store is the only place intents become state transitions. It owns
selection, dialog state (a discriminated union so the open dialog and its
payload can never disagree), and the active panes. Every mutation forwards to a
`lib/` function; the store itself contains no traversal or invariant logic. It
also surfaces user feedback (toasts) when an intent is partially or wholly
rejected by the core.

### 3. Components (`src/components/FileExplorer/`)

Components read derived, already-sorted data and dispatch intents. They are
deliberately dumb about the rules: a drag handler asks the core whether a move
is legal rather than re-deriving that itself.

## Invariants

These hold for every state the core can produce. They are enforced centrally
and covered by the unit suite.

1. **No cycles.** A folder can never become a descendant of itself. Enforced by
   `wouldCreateCycle` / `isDescendantOf` and honored by `moveNodes`.
2. **Relative ordering with dense renumbering on write.** Order is always
   interpreted relatively (`compareNodes`), so gaps are harmless. Whenever a
   folder's contents are rewritten — a reorder, or the destination of a move —
   its children are renumbered densely `0..n-1`. The source of a move keeps its
   surviving siblings in their existing relative sequence rather than being
   re-densified.
3. **Selection independence.** When a folder and one of its descendants are
   selected together, the descendant is dropped from structural operations
   (`filterRedundantIds`) so the subtree is moved or deleted exactly once.
4. **Required files are anchored.** A `mandatory` file may be reordered in place
   but never reparented and never deleted (`partitionMovable`,
   `partitionDeletable`, `subtreeHasMandatory`). Folders that merely _contain_
   required files remain free to move.
5. **Traversal is cycle-safe.** Even against malformed data, upward walks
   (`getBreadcrumbs`, `isDescendantOf`) are guarded by a visited set so a
   corrupt parent pointer can never hang the render.

## Why this shape

- **Testability.** The rules are pure functions, so the suite exercises them
  directly with fixtures — no rendering, no mocked DOM, no flaky timing.
- **Predictability.** The UI cannot invent or bypass a rule; it can only ask the
  core. Adding a constraint means changing one place.
- **Portability.** The core has zero framework dependencies and could back a
  different renderer unchanged.
