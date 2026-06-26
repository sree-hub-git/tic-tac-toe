# System Design Specification: Classic Neon Tic-Tac-Toe (AI Opponent Edition)

This specification details the mathematical model, array storage representations, state manipulation algorithms, and validation checks for a classic 3x3 **Tic-Tac-Toe** grid with a Minimax AI opponent.

---

## 1. Game Concept & Mechanics

In classic Tic-Tac-Toe:
- **Input Control**: Players choose any empty coordinate $(R, C)$ or cell index $i \in \{0, \dots, 8\}$.
- **Placement**: The player's token (X or O) is placed **exactly** in the selected cell.
- **Opponent**: Human player ('X') plays against a computer engine ('O') using a Minimax algorithm for optimal moves.

---

## 2. Grid Representation and Coordinate System

We define the coordinate system with a 1D flat array of length 9:
- Row $0$ (Top): Cells $\{0, 1, 2\}$
- Row $1$ (Middle): Cells $\{3, 4, 5\}$
- Row $2$ (Bottom): Cells $\{6, 7, 8\}$

```
    Col 0      Col 1      Col 2
  ┌──────────┬──────────┬──────────┐
  │  Cell 0  │  Cell 1  │  Cell 2  │  ◄── Row 0 (Top)
  ├──────────┼──────────┼──────────┤
  │  Cell 3  │  Cell 4  │  Cell 5  │  ◄── Row 1 (Middle)
  ├──────────┼──────────┼──────────┤
  │  Cell 6  │  Cell 7  │  Cell 8  │  ◄── Row 2 (Bottom)
  └──────────┴──────────┴──────────┘
```

---

## 3. Minimax AI Opponent

To ensure the AI plays optimally:
- The AI uses a full depth-first **Minimax search** to compute optimal moves in under 1 millisecond.
- **Depth Discounting** is applied to encourage the AI to win as quickly as possible or prolong the game in a losing scenario.

---

## 4. UI Grid & CSS Design

### Grid Container
The grid container occupies a strict $1 \times 1$ aspect ratio, making the board perfectly square and responsive across viewport sizes.

```css
#board, .grid-container {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(3, 1fr);
  gap: 12px;
  width: 100%;
  max-width: 340px;
  aspect-ratio: 1 / 1;
  background: var(--panel-bg);
  border: 1px solid var(--border-color);
  border-radius: 20px;
  padding: 16px;
  backdrop-filter: blur(12px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
  position: relative;
}
```

### Piece scale animation
```css
/* Pop-in animation for X/O pieces */
@keyframes float-up-anim {
  0% {
    transform: scale(0.5);
    opacity: 0;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}
```
This pop-in animation scales each token into place smoothly on click.
