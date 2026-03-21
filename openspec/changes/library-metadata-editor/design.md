## Context

The app currently mixes two concerns: puzzle JSON files carry both gameplay data and library-facing metadata, while `puzzles/index.json` is also generated for browsing. That makes admin maintenance awkward, because changing titles, sources, difficulty, or grouping is not a single catalog operation. The requested workflow introduces an in-browser admin editor for library metadata while keeping built-in puzzle-file creation and placement outside the app.

This change also affects navigation. The browser header currently exposes Create directly and uses a documentation-only affordance. The new model groups browser-level admin and documentation actions inside a settings/documentation area entered from a cog icon.

## Goals / Non-Goals

**Goals:**
- Separate gameplay puzzle data from library catalog metadata.
- Make `index.json` the canonical catalog artifact for built-in puzzles.
- Provide an in-browser spreadsheet-style editor for per-puzzle metadata across all puzzles visible to the app.
- Explain the external admin workflow directly inside the settings/documentation area so the app teaches the intended update process.
- Enforce controlled values for `source`, numeric `difficulty`, and groups.
- Export only the updated `index.json` so an admin can replace the shipped file outside the app.
- Define the in-browser metadata editor as the sole supported mechanism for building and exporting `index.json`.

**Non-Goals:**
- Editing built-in puzzle geometry or win conditions through the metadata editor.
- Writing built-in puzzle files directly into the repository from the browser.
- Preserving any separate generator-managed index state outside the app workflow.
- Adding free-form categories in this change.

## Decisions

### Decision: Make `index.json` the sole canonical owner of library metadata
Puzzle JSON will keep only gameplay/runtime fields such as `id`, `board`, `blocks`, `win_condition`, `win_description`, and `setup_options`. Library-facing metadata such as `title`, `source`, `difficulty`, grouping, and browser-facing derived fields will live in `index.json`.

Rationale:
- Bulk metadata editing becomes a single-file operation.
- The exported admin artifact matches the thing admins replace.
- Puzzle JSON stays focused on puzzle behavior rather than browse/catalog concerns.

Alternative considered:
- Keep metadata duplicated in both puzzle files and `index.json`.
  Rejected because it creates dual ownership and drift.

### Decision: Custom puzzles use a local metadata wrapper rather than extending canonical PuzzleJSON
Custom puzzles will still be editable and playable in-browser, but their local storage model will treat gameplay JSON and browse-time metadata as separate concerns. The local custom collection may therefore store a wrapper record containing canonical puzzle data plus local metadata fields needed by the browser and metadata editor.

Rationale:
- Canonical `PuzzleJSON` stays consistent for built-in and custom gameplay data.
- The metadata editor can include custom puzzles without reintroducing title/source/difficulty into canonical puzzle JSON.

Alternative considered:
- Keep custom puzzle metadata embedded in canonical PuzzleJSON only for local puzzles.
  Rejected because it weakens the separation between gameplay data and catalog metadata.

### Decision: Document the admin update workflow in-app
The settings/documentation area will include a dedicated explanatory section describing how admins update the shipped library: export puzzle JSON from authoring, place it into `puzzles/`, import it into the metadata editor, refine metadata in-app, export `index.json`, and replace the on-disk index file.

Rationale:
- The intended workflow is not obvious from the UI alone.
- This feature intentionally splits authoring/export from repository updates, so the app must explain that boundary clearly.

Alternative considered:
- Leave the workflow implicit and rely on external README instructions only.
  Rejected because the user explicitly wants this process explained within the app.

### Decision: Replace the grouped index structure with a flat catalog plus registries
The canonical index will use a flat list of puzzle rows keyed by puzzle `id`, plus embedded registries for allowed values. Group presentation in the browser will be derived from each puzzle row's group reference rather than authored as a nested tree.

Rationale:
- Spreadsheet editing works naturally on flat rows.
- Controlled metadata can be validated in one place.
- Group titles can be managed once and referenced by puzzle rows.

Alternative considered:
- Keep the existing nested grouped index and patch rows in place.
  Rejected because nested authoring is awkward for bulk editing and group-title normalization.

### Decision: Group IDs are system-managed, group titles are user-managed
Groups are represented as registry records with stable internal IDs and editable titles. Puzzle rows reference the group ID; displayed titles are always resolved through the registry.

Rationale:
- Renaming a group updates presentation without row-by-row manual edits.
- It prevents invalid title/ID mismatches from user edits.

Alternative considered:
- Let users edit `group.id` and `group.title` independently in each row.
  Rejected because it makes registry integrity fragile.

### Decision: Controlled lists live inside `index.json`
The allowed values for `source`, numeric `difficulty`, and groups will be embedded in `index.json` rather than split into a second file.

Rationale:
- One exported artifact fully defines the catalog.
- Validation is self-contained.
- The metadata editor has one source of truth.

Alternative considered:
- Store registries in a separate metadata file.
  Rejected because it adds coordination overhead without a clear benefit for this workflow.

### Decision: The metadata editor owns built-in row creation
The supported workflow for creating or refreshing built-in catalog rows is to import current-format puzzle JSON files into the metadata editor. The editor can start from an empty built-in catalog and produce a complete `index.json` export without any CLI regeneration step.

Rationale:
- The user explicitly wants regeneration to be clean and deterministic.
- It avoids a hidden merge layer between generated and curated state.

Alternative considered:
- Preserve prior edited metadata when regenerating.
  Rejected because the requested workflow prefers explicit re-editing after generation.

## Risks / Trade-offs

- [Admins may expect a CLI regeneration step] → Make the app-managed workflow explicit in docs and remove generator references from supported build steps.
- [Older code may assume puzzle files contain titles or difficulty] → Update affected specs and implementation paths to derive browser metadata from the index.
- [Flat index format is a breaking change from the current grouped object] → Version the index format and document the new schema clearly.
- [Registry validation could make the editor feel strict] → Keep registry editing adjacent to the table and show row-level validation before export.
- [Custom local puzzles and built-in catalog management can be conflated] → Show all puzzles in one editor with explicit row origin, and export only the built-in index-backed subset.

## Migration Plan

1. Introduce the new versioned `index.json` shape with flat puzzle rows and registries.
2. Update the metadata editor to create and refresh built-in rows from imported current-format puzzle JSON files.
3. Update browser loading to resolve puzzle cards and groups from the new catalog format.
4. Add the settings/documentation section and move Create into it as `Create new puzzle`.
5. Add the metadata editor and `Export updated index`, covering built-in and local custom puzzles while exporting only the built-in index-backed rows.
6. Update docs and architecture references to the new ownership model.

## Open Questions

- None. The requested workflow, ownership model, and regeneration behavior are defined.
