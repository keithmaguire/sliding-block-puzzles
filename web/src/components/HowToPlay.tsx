import { DocPage } from './DocPage'
import { Code, H2, H3 } from './docPageContent'
import { prose } from './docPageStyles'

interface Props { onBack: () => void }

export function HowToPlay({ onBack }: Props) {
  return (
    <DocPage title="How to Play" onBack={onBack}>
      <div style={prose}>
        <H2>Before Play Starts</H2>
        <p>
          Some puzzles include optional <strong>setup actions</strong> on the game screen before
          you make the first move.
        </p>
        <p>
          Setup-capable puzzles may let you <strong>shuffle movable pieces</strong> into a legal
          random arrangement or click highlighted <strong>removable blocks</strong> to remove them
          before play begins. These controls appear in the control bar below the puzzle and still
          count as normal progress for the puzzle.
        </p>

        <H2>Selecting a Block</H2>
        <p>
          <strong>Click or tap</strong> any coloured block to select it. The selected block gains a
          white border highlight. Click a different block to change your selection. Press{' '}
          <Code>Escape</Code> or click an empty area of the board to deselect.
        </p>

        <H2>Moving Blocks</H2>

        <H3>Drag</H3>
        <p>
          Press and hold on any movable block, then drag in the direction you want to move it.
          Blocks snap to the grid — a move commits once your drag exceeds <strong>half a cell</strong>{' '}
          in the intended direction. Release before that threshold and the block snaps back without
          moving. Each drag gesture moves the block one step; start a new drag to move it again.
        </p>

        <H3>Keyboard</H3>
        <p>
          First select a block (click or tap it), then use the <strong>arrow keys</strong> to move
          it one step at a time. If the block cannot move in the pressed direction it will briefly
          shake to indicate the block is stuck. Press <Code>Escape</Code> to deselect.
        </p>

        <H2>Game Screen Controls</H2>
        <p>The bar below the board shows:</p>
        <ul>
          <li>
            <strong>Moves</strong> — the number of moves you have made. If the puzzle has a known
            minimum, it appears alongside as <em>/ N</em>.
          </li>
          <li>
            <strong>Undo</strong> — reverses your last move. Disabled when no moves have been made.
            You can undo as many times as you like.
          </li>
          <li>
            <strong>Reset</strong> — returns all blocks to their starting positions and resets the
            move count to zero. Your undo history is cleared.
          </li>
          <li>
            <strong>← Back</strong> — returns to the puzzle browser. Your in-progress move count is
            not saved (only completed solves are recorded).
          </li>
        </ul>

        <H2>Winning</H2>
        <p>
          Each puzzle has a unique goal — placing a specific block, value, or exact shape at a
          target position, arranging several targets at once, or bringing two blocks adjacent to
          each other. When the goal is reached a <strong>win notification</strong> appears showing
          your final move count and, if the puzzle&apos;s minimum move count is known, whether you
          matched or beat it.
        </p>
        <p>
          From the win screen you can <strong>Play Again</strong> (reset the puzzle) or{' '}
          <strong>Back to Browser</strong> (return to the puzzle list). Your best move count for
          each puzzle is saved automatically.
        </p>

      </div>
    </DocPage>
  )
}
