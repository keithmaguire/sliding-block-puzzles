## 1. Canonical Contract Alignment

- [x] 1.1 Audit the Go loader, TypeScript puzzle types, and example puzzle files against the new `puzzle-json-contract`
- [x] 1.2 Align runtime and frontend types with the canonical top-level fields, win-condition union, and compatibility rules
- [x] 1.3 Decide and implement how canonical `win_condition` and compatibility-only `win_conditions` are handled in authoring, import, and export paths

## 2. Documentation Reconciliation

- [x] 2.1 Update the in-app Puzzle Format Reference to match the canonical PuzzleJSON contract, including advanced win conditions and compatibility notes
- [x] 2.2 Update the in-app App Architecture page to reflect the actual runtime/frontend model and supported win-condition types
- [x] 2.3 Update the How to Play page to explain manual-completion puzzles and any related UI behavior
- [x] 2.4 Refresh `puzzles/README.md` so it no longer conflicts with the canonical contract

## 3. Verification and Follow-on Structure

- [x] 3.1 Add or update tests covering advanced win-condition parsing/loading and compatibility handling for legacy index or win-condition forms
- [x] 3.2 Verify that built-in documentation, README guidance, and runtime behavior all describe the same canonical format
- [x] 3.3 Evaluate whether a machine-readable JSON Schema should be added as a follow-up derived from the formal contract
