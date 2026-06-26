document.addEventListener('DOMContentLoaded', () => {
  // --- UI Elements ---
  const cells = document.querySelectorAll('.cell');
  const status = document.getElementById('status');
  const scoreBoard = document.getElementById('scores');
  const endModal = document.getElementById('end-modal');
  const modalTitle = document.getElementById('modal-title');
  const modalDesc = document.getElementById('modal-desc');
  const playerNameInput = document.getElementById('player-name');
  const btnSaveScore = document.getElementById('btn-save-score');
  const btnRestart = document.getElementById('btn-restart');
  const nameFormGroup = document.getElementById('name-form-group');

  // --- Game Engine Variables ---
  let board = Array(9).fill(null); // Flat array representing cells 0-8
  let gameActive = true;
  let isInteractive = true; // Prevents clicking during AI calculation

  const winningConditions = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // cols
    [0, 4, 8], [2, 4, 6]             // diags
  ];

  // --- AI Minimax Solver (Classic Tic-Tac-Toe) ---
  
  function checkWin(boardState, player) {
    return winningConditions.some(cond => {
      return cond.every(idx => boardState[idx] === player);
    });
  }

  function isBoardFull(boardState) {
    return boardState.every(cell => cell !== null);
  }

  function minimax(boardState, depth, isMaximizing) {
    if (checkWin(boardState, 'O')) return 10 - depth;
    if (checkWin(boardState, 'X')) return depth - 10;
    if (isBoardFull(boardState)) return 0;

    if (isMaximizing) {
      let bestScore = -Infinity;
      for (let i = 0; i < 9; i++) {
        if (boardState[i] === null) {
          boardState[i] = 'O';
          let score = minimax(boardState, depth + 1, false);
          boardState[i] = null;
          bestScore = Math.max(bestScore, score);
        }
      }
      return bestScore;
    } else {
      let bestScore = Infinity;
      for (let i = 0; i < 9; i++) {
        if (boardState[i] === null) {
          boardState[i] = 'X';
          let score = minimax(boardState, depth + 1, true);
          boardState[i] = null;
          bestScore = Math.min(bestScore, score);
        }
      }
      return bestScore;
    }
  }

  function computeBestMove(boardState) {
    let bestScore = -Infinity;
    let bestMove = -1;
    for (let i = 0; i < 9; i++) {
      if (boardState[i] === null) {
        boardState[i] = 'O';
        let score = minimax(boardState, 0, false);
        boardState[i] = null;
        if (score > bestScore) {
          bestScore = score;
          bestMove = i;
        }
      }
    }
    return bestMove;
  }

  // --- Move Handler ---

  function handleMove(index, player) {
    if (!gameActive || board[index] !== null) return false;

    // Update state
    board[index] = player;

    // Inject Piece to DOM
    const targetCell = document.querySelector(`.cell[data-index="${index}"]`);
    if (targetCell) {
      const piece = document.createElement('div');
      piece.className = `piece ${player.toLowerCase()}-piece`;
      piece.textContent = player;
      targetCell.appendChild(piece);
    }

    // Check Win/Draw
    if (checkWin(board, player)) {
      gameActive = false;
      showEndGame(player === 'X' ? 'win' : 'lose');
      return true;
    }
    if (isBoardFull(board)) {
      gameActive = false;
      showEndGame('draw');
      return true;
    }

    return false; // Game continues
  }

  function triggerMachineTurn() {
    isInteractive = false;
    status.textContent = "Machine is calculating...";
    status.className = "machine-turn";

    // Standard AI thinking delay for visual pacing
    setTimeout(() => {
      if (!gameActive) return;

      const aiMove = computeBestMove(board);
      if (aiMove !== -1) {
        const isOver = handleMove(aiMove, 'O');
        if (!isOver) {
          isInteractive = true;
          status.textContent = "Your turn: X";
          status.className = "human-turn";
        }
      }
    }, 600);
  }

  // --- End Game Modal ---
  
  function showEndGame(result) {
    status.textContent = result === 'win' ? "Victory!" : result === 'lose' ? "Defeat!" : "Draw!";
    status.className = result === 'win' ? "human-turn" : result === 'lose' ? "machine-turn" : "";

    endModal.classList.add('active');

    if (result === 'win') {
      modalTitle.textContent = "You Won!";
      modalTitle.className = "modal-title win";
      modalDesc.textContent = "Outstanding play! Log your victory to the leaderboard.";
      nameFormGroup.style.display = "block";
      btnSaveScore.style.display = "block";
    } else if (result === 'lose') {
      modalTitle.textContent = "Machine Won!";
      modalTitle.className = "modal-title lose";
      modalDesc.textContent = "The classic Minimax engine played a perfect game.";
      nameFormGroup.style.display = "none";
      btnSaveScore.style.display = "none";
    } else {
      modalTitle.textContent = "It's a Draw!";
      modalTitle.className = "modal-title draw";
      modalDesc.textContent = "Both players made perfect moves.";
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
    board = Array(9).fill(null);
    gameActive = true;
    isInteractive = true;
    playerNameInput.value = '';
    
    // Reset DOM
    cells.forEach(c => c.innerHTML = '');
    endModal.classList.remove('active');
    
    status.textContent = "Your turn: X";
    status.className = "human-turn";
  }

  // --- Listeners Setup ---

  cells.forEach(cell => {
    cell.addEventListener('click', (e) => {
      const index = parseInt(e.currentTarget.getAttribute('data-index'));
      console.log(`Cell clicked: index=${index}`);
      
      if (!isInteractive || !gameActive || board[index] !== null) return;
      
      const isOver = handleMove(index, 'X');
      if (!isOver) {
        triggerMachineTurn();
      }
    });
  });

  btnSaveScore.addEventListener('click', saveScoreAndRestart);
  btnRestart.addEventListener('click', restartGame);

  // --- Leaderboard Integration ---
  
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
