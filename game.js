document.addEventListener('DOMContentLoaded', () => {
  // --- UI Elements ---
  const cells = document.querySelectorAll('.cell');
  const colButtons = document.querySelectorAll('.col-btn');
  const status = document.getElementById('status');
  const scoreBoard = document.getElementById('scores');
  const endModal = document.getElementById('end-modal');
  const modalTitle = document.getElementById('modal-title');
  const modalDesc = document.getElementById('modal-desc');
  const playerNameInput = document.getElementById('player-name');
  const btnSaveScore = document.getElementById('btn-save-score');
  const btnRestart = document.getElementById('btn-restart');
  const nameFormGroup = document.getElementById('name-form-group');

  // --- Game State Classes ---
  class GravityBoard {
    constructor() {
      // 3x3 Grid: Row 0 is Top, Row 2 is Bottom
      this.grid = [
        [null, null, null],
        [null, null, null],
        [null, null, null]
      ];
    }

    placePiece(col, player) {
      // Piece enters at Row 2, floats upward to the highest empty row (0, 1, 2)
      for (let r = 0; r < 3; r++) {
        if (this.grid[r][col] === null) {
          this.grid[r][col] = player;
          return { row: r, col: col };
        }
      }
      return null; // Column is full
    }

    undoMove(row, col) {
      this.grid[row][col] = null;
    }

    isColumnPlayable(col) {
      return this.grid[2][col] === null;
    }

    isFull() {
      return this.grid[2].every(cell => cell !== null);
    }

    hasWon(player) {
      // Check Rows
      for (let r = 0; r < 3; r++) {
        if (this.grid[r][0] === player && this.grid[r][1] === player && this.grid[r][2] === player) return true;
      }
      // Check Columns
      for (let c = 0; c < 3; c++) {
        if (this.grid[0][c] === player && this.grid[1][c] === player && this.grid[2][c] === player) return true;
      }
      // Check Diagonals
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

    minimax(board, depth, isMaximizing) {
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

    computeBestMove(board) {
      let bestScore = -Infinity;
      let bestMove = -1;

      for (let col = 0; col < 3; col++) {
        if (board.isColumnPlayable(col)) {
          const coords = board.placePiece(col, this.ai);
          const score = this.minimax(board, 0, false);
          board.undoMove(coords.row, coords.col);

          if (score > bestScore) {
            bestScore = score;
            bestMove = col;
          }
        }
      }
      return bestMove;
    }
  }

  // --- Game Engine Variables ---
  let board = new GravityBoard();
  const ai = new GravityAI('O', 'X');
  let gameActive = true;
  let isInteractive = true; // Locks controls during AI turns

  // --- Interaction Logics ---
  
  function updateUI() {
    // Clear all pieces from cells
    cells.forEach(cell => {
      cell.innerHTML = '';
    });

    // Render pieces based on board state
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        const value = board.grid[r][c];
        if (value !== null) {
          const index = r * 3 + c;
          const cell = document.querySelector(`.cell[data-index="${index}"]`);
          
          const piece = document.createElement('div');
          piece.className = `piece ${value.toLowerCase()}-piece`;
          piece.textContent = value;
          cell.appendChild(piece);
        }
      }
    }

    // Disable full columns buttons
    for (let c = 0; c < 3; c++) {
      const btn = document.getElementById(`btn-col-0${c}`); // wait, btn ids are btn-col-c
      const button = document.getElementById(`btn-col-${c}`);
      if (button) {
        button.disabled = !board.isColumnPlayable(c) || !gameActive || !isInteractive;
      }
    }
  }

  function handleMove(col, player) {
    if (!gameActive || !board.isColumnPlayable(col)) return;

    // Place the piece
    const coords = board.placePiece(col, player);
    if (!coords) return;

    // Direct DOM injection of the floating piece to avoid re-rendering entire board (preserves animation trigger)
    const index = coords.row * 3 + coords.col;
    const targetCell = document.querySelector(`.cell[data-index="${index}"]`);
    
    const piece = document.createElement('div');
    piece.className = `piece ${player.toLowerCase()}-piece`;
    piece.textContent = player;
    targetCell.appendChild(piece);

    // Disable full columns check
    updateUIControls();

    // Check Results
    if (board.hasWon(player)) {
      gameActive = false;
      showEndGame(player === 'X' ? 'win' : 'lose');
      return true;
    }
    if (board.isFull()) {
      gameActive = false;
      showEndGame('draw');
      return true;
    }

    return false; // Game continues
  }

  function updateUIControls() {
    for (let c = 0; c < 3; c++) {
      const button = document.getElementById(`btn-col-${c}`);
      if (button) {
        button.disabled = !board.isColumnPlayable(c) || !gameActive || !isInteractive;
      }
    }
  }

  function triggerMachineTurn() {
    isInteractive = false;
    updateUIControls();
    
    status.textContent = "Machine is calculating...";
    status.className = "machine-turn";

    // Small timeout for better gameplay pacing (letting player's animation finish)
    setTimeout(() => {
      if (!gameActive) return;

      const aiMove = ai.computeBestMove(board);
      const isOver = handleMove(aiMove, 'O');

      if (!isOver) {
        isInteractive = true;
        updateUIControls();
        status.textContent = "Your turn: X";
        status.className = "human-turn";
      }
    }, 750);
  }

  function showEndGame(result) {
    status.textContent = result === 'win' ? "Victory!" : result === 'lose' ? "Defeat!" : "Draw!";
    status.className = result === 'win' ? "human-turn" : result === 'lose' ? "machine-turn" : "";

    endModal.classList.add('active');

    if (result === 'win') {
      modalTitle.textContent = "You Won!";
      modalTitle.className = "modal-title win";
      modalDesc.textContent = "Amazing strategies. Register your score on our leaderboard!";
      nameFormGroup.style.display = "block";
      btnSaveScore.style.display = "block";
    } else if (result === 'lose') {
      modalTitle.textContent = "Machine Won!";
      modalTitle.className = "modal-title lose";
      modalDesc.textContent = "The minimax engine was too strong this time.";
      nameFormGroup.style.display = "none";
      btnSaveScore.style.display = "none";
    } else {
      modalTitle.textContent = "It's a Draw!";
      modalTitle.className = "modal-title draw";
      modalDesc.textContent = "A perfect defensive standoff on both sides.";
      nameFormGroup.style.display = "none";
      btnSaveScore.style.display = "none";
    }
  }

  function saveScoreAndRestart() {
    const name = playerNameInput.value.trim() || 'Anonymous';
    
    fetch('/score', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ player_name: name })
    })
    .then(r => r.json())
    .then(() => {
      loadScores();
      restartGame();
    })
    .catch(err => {
      console.error("Failed to save score:", err);
      restartGame();
    });
  }

  function restartGame() {
    board = new GravityBoard();
    gameActive = true;
    isInteractive = true;
    playerNameInput.value = '';
    
    // Clear UI and pieces
    cells.forEach(c => c.innerHTML = '');
    endModal.classList.remove('active');
    
    status.textContent = "Your turn: X";
    status.className = "human-turn";
    
    updateUIControls();
  }

  // --- Interactive Highlight Effects ---
  function highlightColumn(col, isHighlighted) {
    cells.forEach(cell => {
      if (parseInt(cell.getAttribute('data-col')) === col) {
        if (isHighlighted) {
          cell.classList.add('col-highlight');
        } else {
          cell.classList.remove('col-highlight');
        }
      }
    });
  }

  // --- Listeners Setup ---

  // Column Selectors
  colButtons.forEach(btn => {
    const col = parseInt(btn.getAttribute('data-col'));
    btn.addEventListener('click', () => {
      if (!isInteractive || !gameActive) return;
      const isOver = handleMove(col, 'X');
      if (!isOver) {
        triggerMachineTurn();
      }
    });

    btn.addEventListener('mouseenter', () => {
      if (isInteractive && gameActive) highlightColumn(col, true);
    });
    btn.addEventListener('mouseleave', () => {
      highlightColumn(col, false);
    });
  });

  // Cell clicks (Fallback column triggers)
  cells.forEach(cell => {
    const col = parseInt(cell.getAttribute('data-col'));
    cell.addEventListener('click', () => {
      if (!isInteractive || !gameActive || !board.isColumnPlayable(col)) return;
      const isOver = handleMove(col, 'X');
      if (!isOver) {
        triggerMachineTurn();
      }
    });

    cell.addEventListener('mouseenter', () => {
      if (isInteractive && gameActive) highlightColumn(col, true);
    });
    cell.addEventListener('mouseleave', () => {
      highlightColumn(col, false);
    });
  });

  // Modal Buttons
  btnSaveScore.addEventListener('click', saveScoreAndRestart);
  btnRestart.addEventListener('click', restartGame);

  // --- Initialize Leaderboard ---
  function loadScores() {
    fetch('/scores')
      .then(r => r.json())
      .then(scores => {
        scoreBoard.innerHTML = '';
        scores.forEach(s => {
          const li = document.createElement('li');
          
          const nameSpan = document.createElement('span');
          nameSpan.className = 'name';
          nameSpan.textContent = s.player_name;
          
          const scoreSpan = document.createElement('span');
          scoreSpan.className = 'score';
          scoreSpan.textContent = s.score;
          
          li.appendChild(nameSpan);
          li.appendChild(scoreSpan);
          scoreBoard.appendChild(li);
        });
      })
      .catch(err => console.error('Error loading scores:', err));
  }

  loadScores();
});
