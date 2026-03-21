## Why

The app can already create and edit puzzle content, but shipped-library metadata is still awkward to maintain because titles and catalog fields are spread across puzzle files and the separately maintained index. A dedicated in-browser metadata editor is needed so admins can manage the library catalog as one coherent dataset and export a replacement `index.json`.

## What Changes

- Add an admin-oriented library metadata editor that shows all puzzles in a spreadsheet-like table for bulk editing of per-puzzle catalog fields.
- Add metadata registries inside `index.json` for allowed numeric `difficulty` values and selectable groups with system-managed IDs and editable titles, while keeping `source` as free text per puzzle row.
- Make `index.json` the canonical source for library metadata, including puzzle `title`, `source`, `difficulty`, grouping, and other browser-facing catalog fields.
- Make puzzle JSON files own gameplay data only; remove canonical library metadata ownership from individual puzzle files.
- Change the browser docs entry into a combined settings/documentation area, replace the question-mark affordance with a cog, rename `Create` to `Create new puzzle`, and move that action into the settings/documentation area.
- Add a dedicated admin-workflow section inside settings/documentation that explains how built-in puzzles and the index are updated outside the app using exported files.
- Add `Export updated index` to write the complete updated `index.json` for admin replacement outside the app.
- Define `index.json` as an app-managed catalog artifact that admins refine and export from the in-browser metadata editor.

## Capabilities

### New Capabilities
- `library-index-management`: Admin-facing editing and export of the library catalog/index, including controlled metadata vocabularies and a spreadsheet-style puzzle table.

### Modified Capabilities
- `doc-navigation`: The documentation entry point becomes a settings/documentation section and hosts the new library-management and create-new-puzzle actions.
- `custom-puzzles`: Local custom puzzle storage and metadata ownership change because canonical `PuzzleJSON` no longer carries browse-time metadata, and the metadata editor must cover custom puzzles too.
- `how-to-play`: User-facing controls documentation changes to reflect the settings/documentation affordance and the single-step drag behavior already intended elsewhere.
- `puzzle-authoring`: Puzzle export becomes gameplay-data-only JSON, and the create entry point moves out of the browser header into settings/documentation.
- `puzzle-json-contract`: Canonical puzzle JSON no longer owns library metadata such as title, source, difficulty, or grouping.
- `puzzle-format-reference`: The documented `index.json` format changes to include canonical library metadata and controlled registries, while puzzle files lose library metadata ownership.
- `app-architecture`: The documented frontend/data-flow architecture changes to describe settings/documentation navigation and the separate library-index workflow.

## Impact

- Affected code: puzzle browser navigation, authoring entry points, index parsing/generation, metadata editing UI, and export flows.
- Affected data contracts: `puzzles/index.json`, library metadata ownership, and puzzle JSON top-level fields.
- Affected tooling: any build or authoring path that assumes puzzle files carry titles or other browse-time metadata.
