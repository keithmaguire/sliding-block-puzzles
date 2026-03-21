## MODIFIED Requirements

### Requirement: A drag gesture commits at most one move
The system SHALL commit exactly one move per drag gesture. Once the displacement threshold (0.5 cells) is exceeded and a move is committed, no further moves SHALL be triggered by continued pointer movement within the same gesture. The player must release and start a new drag to make the next move.

#### Scenario: Drag past one cell does not chain a second move
- **WHEN** the player drags a block more than 1.5 cells in a valid direction in a single gesture
- **THEN** the block SHALL move exactly one cell and the gesture SHALL end, leaving move count incremented by 1

#### Scenario: Each new drag can move the block again
- **WHEN** the player releases after a committed move and begins a new drag on the same block
- **THEN** the block SHALL move one step for the new drag gesture

#### Scenario: Snap-back on sub-threshold release is unchanged
- **WHEN** the player drags a block less than 0.5 cells and releases
- **THEN** the block SHALL snap back without any move being committed
