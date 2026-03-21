## Why

The current in-app authoring story is split across a visual editor and a custom text notation. That split has made the product contract harder to explain, harder to document, and harder to keep lossless across editing, testing, saving, and export. This change simplifies authoring around a single visual workflow and uses JSON as the only in-app interchange format.

## What Changes

- Add a new **`puzzle-authoring`** capability that defines the full in-app authoring workflow as visual-only editing.
- **BREAKING** Remove the in-app custom text-notation editor, parser/serializer workflow, notation guide, and visual/text tab switching.
- Add JSON import to the authoring workflow. Import replaces the current authored puzzle after successful validation.
- Add dirty-state confirmation for destructive authoring actions, including JSON import and leaving the authoring workflow.
- Make built-in and custom puzzles editable through the same authoring workflow, with browser entry points for Create and Edit existing puzzle.
- Keep JSON export, Try It, Add to Library, and Back as the authoring-level actions.

## Capabilities

### New Capabilities
- `puzzle-authoring`: Visual-only in-app workflow for creating, editing, testing, importing, exporting, and saving puzzles.

### Modified Capabilities
- `visual-puzzle-editor`: Fold the editor into the broader authoring workflow and require full-fidelity visual editing for all supported puzzle features.
- `custom-puzzles`: Update save/edit workflows so both built-in and custom puzzles are opened and saved through the visual authoring flow, with same-ID replacement semantics preserved.
- `app-architecture`: Replace the documented text-authoring pipeline with the visual-only authoring and JSON import/export workflow.
- `puzzle-text-authoring`: Remove the in-app text-notation editing requirements and retire the custom text authoring workflow from the product contract.

## Impact

- Frontend authoring UI, routing, and authoring-state management
- JSON import/export flow and validation behavior
- Puzzle editing entry points from the browser
- Dirty-state tracking and destructive-action confirmations
- Documentation and architecture pages that currently describe text authoring modules and tab sync
