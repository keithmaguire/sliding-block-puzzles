## REMOVED Requirements

### Requirement: `parseTextPuzzle` function
**Reason**: The product no longer provides a custom in-app text authoring workflow. JSON is now the only in-app interchange format, and authoring is visual-only.
**Migration**: Use Puzzle Authoring for in-app editing and JSON import/export for interchange. Advanced text-based edits happen outside the app against source files.

### Requirement: `puzzleToText` serialiser
**Reason**: The system no longer needs to serialize puzzles to a custom text notation for in-app editing.
**Migration**: Export puzzles as JSON instead.

### Requirement: In-app Puzzle Creator with two modes
**Reason**: The product now uses a single visual-only Puzzle Authoring workflow instead of separate visual and text modes.
**Migration**: Open Puzzle Authoring and edit puzzles through the visual interface.

### Requirement: Text mode parse and preview
**Reason**: Text mode is no longer part of the in-app authoring workflow.
**Migration**: Use JSON import for bringing puzzle data into the app and rely on the visual editor for in-app inspection and modification.

### Requirement: Creator action buttons
**Reason**: Action handling now belongs to the `puzzle-authoring` capability rather than a dual-mode text/visual creator.
**Migration**: Use the Puzzle Authoring action bar for Try It, Add to Library, Import JSON, Export JSON, and Back.

### Requirement: In-app notation guide
**Reason**: The custom text notation is no longer exposed as an in-app editing interface.
**Migration**: No in-app replacement. Advanced manual edits are out of scope for the app and can be done in source files outside the browser.
