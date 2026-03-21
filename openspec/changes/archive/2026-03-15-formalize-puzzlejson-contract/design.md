## Context

The app currently has several competing descriptions of the puzzle format:
- the Go loader and runtime behavior
- TypeScript puzzle types
- OpenSpec documentation requirements
- in-app documentation pages
- `puzzles/README.md`

These descriptions have drifted. The runtime supports more fields and win-condition types than the documented contract, and some documentation still presents stale field names and older index formats. The result is confusion for puzzle authors and no single reliable place to answer "what is valid puzzle JSON?" or "what is the canonical serialized form?"

## Goals / Non-Goals

**Goals:**
- Define a formal canonical `PuzzleJSON` contract in OpenSpec.
- Make advanced win conditions (`any_of`, `description_only`) first-class documented features.
- Treat edge-reaching goals as ordinary `position` wins rather than a distinct public `exit` type.
- Define canonical vs compatibility representations, especially for `win_condition` vs `win_conditions`.
- Align format-reference and architecture specs with the actual supported runtime model.
- Clarify player-facing behavior for manual-completion puzzles.
- Leave room for a future machine-readable JSON Schema derived from the formal contract.

**Non-Goals:**
- Implementing a JSON Schema in this change.
- Redesigning the puzzle runtime model or win-condition semantics.
- Removing currently supported puzzle features.
- Reworking visual authoring or gameplay behavior outside what is needed for documentation clarity.

## Decisions

### Add a new `puzzle-json-contract` capability

The formal serialized format should have its own capability instead of living only inside user-facing format reference prose. This gives the project a normative contract for structure, semantics, invariants, and canonicalization rules.

Alternative considered:
- Expanding only `puzzle-format-reference`. Rejected because that page is user-facing and is a poor place to carry the full normative contract by itself.

### Separate canonical representation from compatibility input

The runtime can accept compatibility forms without making them canonical. For multi-way wins, the canonical public format is:

`win_condition: { "type": "any_of", "conditions": [...] }`

The top-level `win_conditions` array is treated as compatibility input rather than the preferred serialized form.

Alternative considered:
- Keeping both forms equally canonical. Rejected because it weakens the contract and creates avoidable ambiguity in documentation and future schema work.

### Treat `any_of` and `description_only` as public format features

These are not implementation accidents. They represent real product concepts:
- `any_of` for puzzles with multiple valid engine-checked winning paths
- `description_only` for puzzles whose completion criterion is judged by the player

Alternative considered:
- Leaving them undocumented. Rejected because they already affect runtime, UI, and puzzle semantics.

### Treat `exit` as non-canonical rather than a public puzzle concept

The public contract does not need a distinct `exit` win-condition type. Edge-reaching goals can be represented as `position` targets at the board edge. Any exit-like visual treatment should come from puzzle geometry and background-colored fixed blocks, not from win semantics.

Alternative considered:
- Keeping `exit` as a public win type. Rejected because it is a special-case encoding of a board-edge position goal and makes the contract larger without adding necessary expressive power.

### Distinguish structural contract from human-facing explanation

The formal contract should define field shapes, invariants, and meaning. User-facing docs should explain those concepts more gently, but they must derive from the same contract.

Alternative considered:
- Relying on informal prose only. Rejected because it has already led to drift.

### Keep JSON Schema as a follow-on, not a prerequisite

The project should first agree on the normative contract in OpenSpec. A machine-readable JSON Schema can then be added as a derived artifact. This avoids encoding the wrong structure in schema before the product contract is settled.

Alternative considered:
- Writing JSON Schema first. Rejected because schema alone does not capture enough gameplay semantics or canonicalization policy.

## Risks / Trade-offs

- [Documentation becomes more formal and longer] → Mitigation: separate the normative `puzzle-json-contract` from the more approachable format-reference page.
- [Compatibility handling may be misunderstood as endorsement] → Mitigation: explicitly label legacy/compatibility forms as accepted but non-canonical.
- [Legacy exit puzzles may still exist during migration] → Mitigation: treat `exit` as compatibility-only where necessary, while migrating built-in/public puzzle definitions and docs to `position`.
- [Exposing `description_only` may raise UX questions] → Mitigation: update How to Play so player-judged completion is explained as a normal supported puzzle type.
- [Future schema work may still diverge] → Mitigation: make the new capability the normative source that later schema and docs must follow.

## Migration Plan

1. Add the new `puzzle-json-contract` capability with formal field and semantic definitions.
2. Update `puzzle-format-reference` so it reflects the formal contract and clearly distinguishes canonical vs compatibility input.
3. Update `app-architecture` so the documented runtime/frontend model matches the actual supported win-condition types and puzzle fields.
4. Update `how-to-play` to explain manual-completion puzzles.
5. Refresh `puzzles/README.md` and in-app docs against the new contract during implementation.
6. Optionally add machine-readable JSON Schema in a future follow-up once the contract is stable.

## Open Questions

- Whether `puzzles/README.md` should remain hand-maintained or be generated from the formal contract in a later change.
- Whether the formal contract should enumerate validation/error behavior in full detail or leave some loader-specific failures to implementation docs.
