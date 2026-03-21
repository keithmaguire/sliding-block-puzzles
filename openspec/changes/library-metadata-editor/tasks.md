## 1. Index Contract And Generation

- [x] 1.1 Define the new canonical `index.json` shape with flat puzzle rows and embedded registries
- [x] 1.2 Define `puzzles/index.json` as the canonical built-in metadata catalog owned by the app workflow
- [x] 1.3 Update index parsing/loading code to consume the new versioned catalog format
- [x] 1.4 Update built-in browser grouping logic to derive groups from `group_id` registry references
- [x] 1.5 Add tests covering regenerated placeholder rows and registry integrity

## 2. Settings And Navigation

- [x] 2.1 Replace the browser help affordance with a settings/documentation cog entry point
- [x] 2.2 Move `Create` into the settings/documentation section and rename it to `Create new puzzle`
- [x] 2.3 Add `Edit library metadata` as a browser-level action in the settings/documentation section
- [x] 2.4 Preserve existing browser-to-doc and game-to-doc return behavior after the settings/documentation rename

## 3. Library Metadata Editor

- [x] 3.1 Implement a spreadsheet-style editor for all puzzles with editable title, source, difficulty, and group selection
- [x] 3.2 Implement adjacent registry editing UI for numeric difficulties and group titles with system-managed group IDs
- [x] 3.3 Add validation that blocks export while any puzzle row references values outside the registries
- [x] 3.4 Distinguish built-in and custom rows in the metadata editor and exclude custom rows from built-in index export
- [x] 3.5 Implement `Export updated index` to download the complete replacement `index.json`
- [x] 3.6 Add tests covering row editing, registry editing, validation failures, and export behavior

## 4. Puzzle Authoring And Catalog Ownership

- [x] 4.1 Remove canonical library metadata ownership from exported puzzle JSON and align authoring/export behavior with the new contract
- [x] 4.2 Update built-in browser and gameplay code paths so browse-time metadata is resolved from the index while gameplay data is loaded from puzzle files
- [x] 4.3 Update custom-puzzle storage so canonical puzzle gameplay data and browser-local metadata are stored separately
- [x] 4.4 Surface custom-puzzle metadata correctly in My Puzzles and in the metadata editor
- [x] 4.5 Verify the external admin workflow for adding a built-in puzzle: export JSON, place file in `puzzles/`, import it into the metadata editor, edit metadata, export updated index

## 5. Documentation And Verification

- [x] 5.1 Update in-app documentation pages to describe the settings/documentation section and library metadata editor
- [x] 5.2 Add the in-app admin-workflow documentation covering puzzle JSON export, `puzzles/` placement, metadata-editor import, metadata editing, and index replacement
- [x] 5.3 Update the puzzle format and app architecture docs to describe index-owned metadata and regenerated placeholder catalogs
- [x] 5.4 Update user-facing control text from help/docs wording to settings/documentation wording where required
- [x] 5.5 Add or update tests covering the new index format, regeneration behavior, registry validation, metadata editing, and export flow
