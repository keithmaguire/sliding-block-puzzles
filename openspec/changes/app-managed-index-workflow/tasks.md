## 1. Remove Legacy Compatibility

- [x] 1.1 Delete legacy custom-puzzle storage migration code and keep only the current record shape
- [x] 1.2 Reject superseded puzzle-file metadata fields on JSON import
- [x] 1.3 Remove obsolete generator-only code paths and tests that no longer belong to the supported workflow

## 2. Build The Index In-App

- [x] 2.1 Allow the metadata editor to initialize from an empty built-in catalog when needed
- [x] 2.2 Add puzzle-JSON import to the metadata editor for creating or refreshing built-in rows
- [x] 2.3 Allow built-in rows to be removed from the metadata editor
- [x] 2.4 Add tests covering current-format import, row creation, and export behavior

## 3. Remove CLI Index Generation From The Workflow

- [x] 3.1 Remove index regeneration from `make build` and related build targets
- [x] 3.2 Remove documentation that tells users to run CLI index-generation steps

## 4. Scrub Specs And Docs

- [x] 4.1 Update in-app docs to describe only the app-managed index workflow
- [x] 4.2 Update repo docs to describe only the app-managed index workflow
- [x] 4.3 Update OpenSpec capabilities and this change so there are no legacy-format or CLI-index references left in the normative path
