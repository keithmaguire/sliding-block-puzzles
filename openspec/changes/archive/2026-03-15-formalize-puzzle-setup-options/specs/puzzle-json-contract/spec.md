## ADDED Requirements

### Requirement: setup_options remains public but evolvable
The formal PuzzleJSON contract SHALL describe `setup_options` as a public optional field whose currently supported contents are defined separately by the setup-options capability.

The contract SHALL state that `setup_options` may gain additional fields in future.

#### Scenario: setup_options evolvability noted in PuzzleJSON contract
- **WHEN** an author reads the PuzzleJSON contract
- **THEN** the contract SHALL state that `setup_options` is public and extensible
