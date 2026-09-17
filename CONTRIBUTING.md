# Contributing

Thanks for taking the time to contribute. This project favours small, focused
changes with a clear rationale over large sweeping ones.

## Getting started

```bash
npm install
npm run dev
```

## Before you open a pull request

Run the same checks CI runs, in this order:

```bash
npm run typecheck     # tsc -b, strict
npm run lint          # oxlint
npm run format:check  # prettier
npm test              # vitest run
```

`npm run format` fixes formatting automatically.

## Where code belongs

This codebase draws a hard line between rules and presentation (see
[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)):

- **Structural rules** about how the file tree may change live in
  `src/lib/`. They are pure functions — no React, no side effects — and must
  come with unit tests.
- **The store** (`src/store/`) turns intents into state transitions by
  delegating to `src/lib/`. It holds no traversal or invariant logic.
- **Components** (`src/components/`) read derived state and dispatch intents.
  They should never re-derive a rule the core already owns.

If you find yourself re-implementing a tree rule inside a component, move it
into the core instead.

## Commit and branch conventions

- Branch names describe the work: `docs/…`, `chore/…`, `test/…`, `feat/…`,
  `fix/…`.
- Commit subjects follow Conventional Commits (`type: imperative summary`) and
  the body explains _why_, not just _what_.
- Keep each commit to one logical change so history stays reviewable.

## Code style

Formatting and linting are enforced automatically; defer to `prettier` and
`oxlint` rather than hand-formatting. Prefer readable names over comments, and
reserve comments for intent the code cannot express on its own.
