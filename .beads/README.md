# Beads issue tracking

This repository uses Beads 1.3.4 with an embedded Dolt database in
`.beads/embeddeddolt/`. No separate SQL server is required.

```sh
bd ready --json
bd show <id> --json
bd update <id> --claim --json
bd close <id> --reason "Completed" --json
```

The embedded database is local and ignored by Git. Automatic JSONL export is
enabled in `config.yaml`; refresh the tracked recovery export before committing
issue changes:

```sh
bd export --all -o .beads/issues.jsonl
```

No Dolt remote was configured before the migration. Git pushes preserve the
tracked JSONL export, not the full Dolt database history. `bd sync` and
`bd dolt push` manage a separately configured Dolt remote; they do not replace
exporting issue records to Git.

To restore issues in a fresh checkout with no local Beads database:

```sh
bd init --from-jsonl --prefix sliding-puzzle-claude --skip-agents --non-interactive
```

Do not reinitialize an existing local database to restore records. Import an
export into it with `bd import .beads/issues.jsonl` instead.

## Migration from 0.62.0

The legacy Dolt server workspace was migrated to 1.3.4 through an official,
SHA-256-verified 0.62.0 binary and a disposable copy of the database. All 241
historical issues and 166 dependency links were preserved. Comparison of the
historical and current exports found only the new `_type: "issue"` field.

The original workspace, native Dolt history, checksum manifest, historical
binary, and verification exports are retained locally under
`.beads-migration/20261110T112558Z/` (ignored by Git). The untouched workspace at
`pre-cutover-beads/` can be restored while all Beads processes are stopped;
it requires Beads 0.62.0. Historical Dolt commit and event history is retained in
these backups, rather than imported into the new database.
