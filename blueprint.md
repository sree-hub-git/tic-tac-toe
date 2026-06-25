# Strict Technical Design Specification: Upward-Gravity 3x3 Grid Logic

This specification details the mathematical model, array storage representations, state manipulation algorithms, and validation checks for a 3x3 **Upward-Gravity Tic-Tac-Toe** grid.

---

## 1. Mathematical Model & Coordinate System

An upward-gravity grid is a $3 \times 3$ discrete matrix. Let the rows be indexed by $r \in \{0, 1, 2\}$ and columns by $c \in \{0, 1, 2\}$.

### Coordinate Convention
- **Top Row ($r = 0$)**: The absolute boundary representing the terminal floating position.
- **Bottom Row ($r = 2$)**: The entry point where pieces enter.
- **Empty State**: Represented by `null` (or `0` in bitwise models).
- **Player States**: Represented by identifiers `X` (Player 1) and `O` (Player 2).

### Gravity Vector
Unlike classical physical gravity which pulls mass towards higher row indexes (downward, i.e., $r = 2$), upward gravity pulls mass towards lower row indexes (upward, i.e., $r = 0$).

$$\vec{g} = -1 \cdot \hat{r}$$

When a token is inserted into column $c$, it traverses from $r = 2$ up to $r = 0$ until it encounters either the boundary ($r = 0$) or an occupied cell $(r', c)$. Mathematically, the target row $r_{target}$ for an insertion in column $c$ is:

$$r_{target} = \min \{ r \in \{0, 1, 2\} \mid \text{Grid}[r][c] \text{ is empty} \}$$

If $\{ r \mid \text{Grid}[r][c] \text{ is empty} \} = \emptyset$, the column is fully occupied and the insertion is invalid.

---

## 2. Grid Representation Patterns

### Pattern A: 2D Row-Major Matrix (Top-Down Indexing)
The grid is stored as a 2D array of size $3 \times 3$.
```javascript
// Initial empty state
const grid = [
  [null, null, null], // Row 0 (Top)
  [null, null, null], // Row 1 (Middle)
  [null, null, null]  // Row 2 (Bottom)
];
```

#### Insertion Algorithm
Iterating from index `0` to `2` guarantees that the piece floats to the highest available row in the selected column.

```javascript
function placePiece2D(grid, col, player) {
  if (col < 0 || col > 2) throw new Error("Index out of bounds");
  
  for (let r = 0; r < 3; r++) {
    if (grid[r][col] === null) {
      grid[r][col] = player;
      return { row: r, col: col };
    }
  }
  return null; // Column full
}
```

---

### Pattern B: Flat 1D Array Layout
To reduce pointer overhead, the grid is flattened into a 1D array of length 9.

#### Index Mapping Function
A 2D coordinate $(r, c)$ maps to a 1D index $i$ via:

$$i = r \cdot 3 + c$$

Conversely, a 1D index $i$ maps to 2D coordinates via:

$$r = \lfloor i / 3 \rfloor, \quad c = i \pmod 3$$

#### Layout Visualization
```
Index Mapping:
[ 0, 1, 2 ]  <-- Row 0 (Top)
[ 3, 4, 5 ]  <-- Row 1 (Middle)
[ 6, 7, 8 ]  <-- Row 2 (Bottom)
  |  |  |
 Col0| Col2
    Col1
```

#### Insertion Algorithm
```javascript
function placePiece1D(flatGrid, col, player) {
  if (col < 0 || col > 2) throw new Error("Index out of bounds");

  for (let r = 0; r < 3; r++) {
    const idx = r * 3 + col;
    if (flatGrid[idx] === null) {
      flatGrid[idx] = player;
      return idx; // Returns flat index
    }
  }
  return -1; // Column full
}
```

---

### Pattern C: Bitboard Representation (High Performance)
For search engines (e.g., Minimax), the entire board state is packed into two 9-bit integers: `P_X` (Player X positions) and `P_O` (Player O positions).

#### Bit Mapping
A cell $(r, c)$ corresponds to the bit at offset:

$$\text{shift} = r \cdot 3 + c$$

$$\text{Bitmask} = 1 \ll \text{shift}$$

```
Bit Offsets:
2^0  2^1  2^2
2^3  2^4  2^5
2^6  2^7  2^8
```

#### Column Masks
To determine occupancy per column, we define 9-bit column masks:
- $\text{Mask}_{\text{Col 0}} = (1 \ll 0) \mid (1 \ll 3) \mid (1 \ll 6) = 73 \quad (\text{binary } 001001001_2)$
- $\text{Mask}_{\text{Col 1}} = (1 \ll 1) \mid (1 \ll 4) \mid (1 \ll 7) = 146 \quad (\text{binary } 010010010_2)$
- $\text{Mask}_{\text{Col 2}} = (1 \ll 2) \mid (1 \ll 5) \mid (1 \ll 8) = 292 \quad (\text{binary } 100100100_2)$

#### Bitwise Insertion Algorithm
```python
class BitboardBoard:
    COL_MASKS = [73, 146, 292]
    COL_SHIFTS = [0, 3, 6]

    def __init__(self):
        self.p_x = 0  # 9-bit integer
        self.p_o = 0  # 9-bit integer

    def get_occupied(self):
        return self.p_x | self.p_o

    def place_piece(self, col: int, is_x: bool) -> int:
        """Attempts to place a piece in column `col`.
        Returns the bit index where it landed, or -1 if full.
        """
        occupied = self.get_occupied()
        
        # Scan from top row shift (0) to bottom row shift (6)
        for row_shift in self.COL_SHIFTS:
            bit_index = col + row_shift
            bit_mask = 1 << bit_index
            
            if not (occupied & bit_mask):
                if is_x:
                    self.p_x |= bit_mask
                else:
                    self.p_o |= bit_mask
                return bit_index
        return -1  # Column is full
```

---

## 3. Win Condition Detection Logic

### Line Vectors (Lines of 3)
A win is declared if any of the following 8 paths are fully occupied by a single player:

| Win Category | Path Indexes (1D) | Bitmask (Decimal) | Bitmask (Binary) |
| :--- | :--- | :--- | :--- |
| **Row 0** | $\{0, 1, 2\}$ | $7$ | `000000111` |
| **Row 1** | $\{3, 4, 5\}$ | $56$ | `000111000` |
| **Row 2** | $\{6, 7, 8\}$ | $448$ | `111000000` |
| **Column 0** | $\{0, 3, 6\}$ | $73$ | `001001001` |
| **Column 1** | $\{1, 4, 7\}$ | $146$ | `010010010` |
| **Column 2** | $\{2, 5, 8\}$ | $292$ | `100100100` |
| **Diagonal Main** | $\{0, 4, 8\}$ | $273$ | `100010001` |
| **Diagonal Anti** | $\{2, 4, 6\}$ | $84$ | `001010100` |

### Bitwise Win Checking
A player has won if their bitboard matches any win mask:

$$\text{IsWin}(P) = \bigvee_{M \in \text{WinMasks}} (P \wedge M == M)$$

```python
WIN_MASKS = [7, 56, 448, 73, 146, 292, 273, 84]

def check_win(player_bitboard: int) -> bool:
    for mask in WIN_MASKS:
        if (player_bitboard & mask) == mask:
            return True
    return False
```

---

## 4. Game-Theoretic Analysis

- **Value**: **Forced Draw**. Under optimal play from both players, the game will always terminate in a tie.
- **Symmetry**: Unlike standard Tic-Tac-Toe, vertical reflection is the only valid board symmetry due to gravity. Horizontal reflection is not valid because columns are directional (gravity acts along the rows, not columns).
- **First-Player Edge**: Player X's best first move is the middle column (Col 1), occupying cell $(0, 1)$ due to upward gravity. Player O's optimal response is either Col 1 (occupying cell $(1,1)$) or Col 0/2 to block adjacent vectors.

---

## 5. CSS Grid Layout & Anti-Gravity Animation Model

### The Grid Structural Canvas
The game board is represented by a container `.grid-container` containing 9 cell elements `.cell`. To resolve layout rendering bugs (e.g., rendering as a single vertical column of blocks), the `.grid-container` must be explicitly defined as a 3-column CSS Grid with a strict 1:1 aspect ratio constraint.

```css
.grid-container {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(3, 1fr);
  gap: 12px;
  width: 100%;
  max-width: 360px;          /* Constrains layout size on desktop */
  aspect-ratio: 1 / 1;       /* Enforces a perfect square container */
  margin: 0 auto;
  padding: 16px;
  box-sizing: border-box;
  position: relative;
}

.cell {
  position: relative;
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  overflow: visible;         /* Permits tokens to float in/out during transitions */
}
```

### Preserving Upward-Gravity Animations in a 3x3 Grid
In a CSS grid, grid items are statically locked into their cell coordinates. To animate a piece floating upward from the entry point below the board, we apply a starting 2D translation offset using CSS variables that correspond to the row index $r$.

#### Mathematical Offset Formula
To make the piece float from the bottom entry threshold (below Row 2, acting as Row 3) to its resting Row $r$:

$$\Delta Y = (3 - r) \cdot (\text{Cell Height} + \text{Gap})$$

In pure CSS percentage terms, relative to the cell height, the offset is:
- **Row 0**: Starts $+300\%$ offset + gaps.
- **Row 1**: Starts $+200\%$ offset + gaps.
- **Row 2**: Starts $+100\%$ offset + gaps.

#### CSS Animation Implementation
```css
/* Dynamic translation offset based on landing row */
.cell[data-row="0"] .piece {
  --start-y: calc(300% + 36px); /* 3 cell heights + 3 gaps */
}
.cell[data-row="1"] .piece {
  --start-y: calc(200% + 24px); /* 2 cell heights + 2 gaps */
}
.cell[data-row="2"] .piece {
  --start-y: calc(100% + 12px); /* 1 cell height + 1 gap */
}

/* Floating token design */
.piece {
  width: 80%;
  height: 80%;
  margin: 10%;
  border-radius: 50%;
  will-change: transform, opacity;
  animation: float-up-anim 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

/* Animation sequence */
@keyframes float-up-anim {
  0% {
    transform: translateY(var(--start-y));
    opacity: 0;
  }
  20% {
    opacity: 1;
  }
  100% {
    transform: translateY(0);
    opacity: 1;
  }
}
```
This ensures that the pieces start completely below the board boundary and ascend smoothly to their designated target row index, preserving the physical mechanics of inverted gravity.

---

## 6. Human vs. Machine AI Architecture

To support a single-player game mode, the application requires an AI opponent module that computes the optimal column placement in response to the user's action.

### Single-Player Game Loop Flow
1. **User Action**: The human player clicks a column selector $C_{human}$.
2. **State Transition**: The game engine verifies column legality, inserts the token, performs the upward-gravity translation, and checks for terminal states (win/draw).
3. **Control Shift & Locking**: If the game continues, interactive inputs are locked (`isInteractive = false`) to prevent the user from making moves out of turn.
4. **AI Decision Execution**:
   - The game engine triggers the `GravityAI` module.
   - To make the interaction feel natural, the AI delay is wrapper-controlled (e.g., `setTimeout` for 600-800ms, matching the animation duration).
5. **AI Placement**: The computed column $C_{machine}$ is executed on the grid, and its token floats up.
6. **State Evaluation**: Win/draw check is executed.
7. **Control Release**: Interactive inputs are unlocked (`isInteractive = true`), resuming the Human's turn.

### Minimax Solver with Depth Discounting
Because the maximum branching factor of the game is 3, and the grid capacity is 9 tokens, the game space is exceptionally small ($3^9 = 19,683$ states, with only a fraction being legally reachable). This allows us to use a full depth-first **Minimax search** to compute optimal moves in under 1 millisecond.

To ensure the AI plays with high intelligence:
- It uses **Depth Discounting**: Earlier wins are scored higher ($10 - \text{depth}$); delayed losses are prioritized over immediate losses ($-10 + \text{depth}$).

#### JS Implementation: AI Controller & Game Board Adaptors
The following script details the AI module and necessary state management adaptors (`undoMove` and `isFull`):

```javascript
class GravityBoardWithUndo extends GravityBoard {
  /**
   * Reverts a move at specific coordinates.
   * @param {number} row 
   * @param {number} col 
   */
  undoMove(row, col) {
    this.grid[row][col] = null;
  }

  /**
   * Returns true if all columns are occupied.
   */
  isFull() {
    return this.grid[2].every(cell => cell !== null);
  }

  /**
   * Helper to verify if a win state exists for a specific player.
   */
  hasWon(player) {
    // Check rows, columns, and diagonals
    for (let r = 0; r < 3; r++) {
      if (this.grid[r][0] === player && this.grid[r][1] === player && this.grid[r][2] === player) return true;
    }
    for (let c = 0; c < 3; c++) {
      if (this.grid[0][c] === player && this.grid[1][c] === player && this.grid[2][c] === player) return true;
    }
    if (this.grid[0][0] === player && this.grid[1][1] === player && this.grid[2][2] === player) return true;
    if (this.grid[0][2] === player && this.grid[1][1] === player && this.grid[2][0] === player) return true;
    
    return false;
  }
}

class GravityAI {
  constructor(aiPlayer = 'O', humanPlayer = 'X') {
    this.ai = aiPlayer;
    this.human = humanPlayer;
  }

  /**
   * Minimax search with depth tracking for perfect AI play.
   */
  minimax(board, depth, isMaximizing) {
    // Terminal state checks
    if (board.hasWon(this.ai)) return 10 - depth;
    if (board.hasWon(this.human)) return depth - 10;
    if (board.isFull()) return 0;

    if (isMaximizing) {
      let bestScore = -Infinity;
      for (let col = 0; col < 3; col++) {
        if (board.isColumnPlayable(col)) {
          const coords = board.placePiece(col, this.ai);
          const score = this.minimax(board, depth + 1, false);
          board.undoMove(coords.row, coords.col);
          bestScore = Math.max(bestScore, score);
        }
      }
      return bestScore;
    } else {
      let bestScore = Infinity;
      for (let col = 0; col < 3; col++) {
        if (board.isColumnPlayable(col)) {
          const coords = board.placePiece(col, this.human);
          const score = this.minimax(board, depth + 1, true);
          board.undoMove(coords.row, coords.col);
          bestScore = Math.min(bestScore, score);
        }
      }
      return bestScore;
    }
  }

  /**
   * Scans playable columns and returns the index of the optimal move.
   * @param {GravityBoardWithUndo} board 
   * @returns {number} Column index (0, 1, or 2)
   */
  computeBestMove(board) {
    let bestScore = -Infinity;
    let bestMove = -1;

    // Scan all columns
    for (let col = 0; col < 3; col++) {
      if (board.isColumnPlayable(col)) {
        // Test placing AI piece
        const coords = board.placePiece(col, this.ai);
        // Compute path weight (starting minimizing search for human's response)
        const score = this.minimax(board, 0, false);
        // Revert test placement
        board.undoMove(coords.row, coords.col);

        if (score > bestScore) {
          bestScore = score;
          bestMove = col;
        }
      }
    }
    
    // Fallback if no moves are possible (should not occur unless called on full board)
    return bestMove;
  }
}
```
This module gives the machine complete logic to play optimally. Since the state space is small, no alpha-beta pruning is strictly required, though minimax handles computation sub-millisecond, leaving plenty of performance room for UI animations.


