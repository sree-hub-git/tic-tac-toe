document.addEventListener('DOMContentLoaded', () => {
  const cells = document.querySelectorAll('.cell');
  const status = document.getElementById('status');
  const scoreBoard = document.getElementById('scores');
  let board = Array(9).fill('');
  let currentPlayer = 'X';
  let gameActive = true;
  let machineTurn = false;

  const winningConditions = [
    [0,1,2],[3,4,5],[6,7,8], // rows
    [0,3,6],[1,4,7],[2,5,8], // cols
    [0,4,8],[2,4,6]          // diags
  ];

  function handleCellClick(e) {
    const clickedCell = e.target;
    const clickedIndex = parseInt(clickedCell.getAttribute('data-index'));
    if (board[clickedIndex] !== '' || !gameActive) return;

    if (machineTurn) {
      // Machine's turn
      const machineMove = machineMove();
      board[clickedIndex] = machineMove;
      clickedCell.textContent = machineMove;
      clickedCell.classList.add('machine-move');
      clickedCell.classList.remove('disabled');
      status.textContent = `Machine is thinking...`;
      machineTurn = false;
      checkResult();
    } else {
      // Human's turn
      board[clickedIndex] = currentPlayer;
      clickedCell.textContent = currentPlayer;
      clickedCell.classList.add('human-move');
      clickedCell.classList.remove('machine-move');
      status.textContent = `Your turn: ${currentPlayer}`;
      gameActive = false;
      machineTurn = true;
      checkResult();
    }
  }

  function machineMove() {
    // Check for immediate win or block
    const win = checkWin();
    if (win) {
      return win ? 'O' : 'X';
    }

    // Check for block (prevent human from clicking)
    if (board[0] === currentPlayer) {
      return board[3]; // Block human from clicking
    }

    // Fallback to random move (for demo)
    const randomIndex = Math.floor(Math.random() * 9);
    return board[randomIndex];
  }

  function checkWin() {
    for (let i = 0; i < winningConditions.length; i++) {
      const [a,b,c] = winningConditions[i];
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return board[a] === currentPlayer;
      }
    }
    return board[0] === currentPlayer;
  }

  function checkResult() {
    let roundWon = false;
    for (let i = 0; i < winningConditions.length; i++) {
      const [a,b,c] = winningConditions[i];
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        roundWon = true;
        break;
      }
    }

    if (roundWon) {
      status.textContent = `You win!`;
      gameActive = false;
      currentPlayer = machineTurn ? 'O' : 'X';
      status.textContent = `Machine won!`;
      machineTurn = false;
      loadScores();
    } else if (board.includes('')) {
      status.textContent = "It's a draw!";
      gameActive = false;
    } else {
      currentPlayer = machineTurn ? 'O' : 'X';
      status.textContent = `Your turn: ${currentPlayer}`;
    }
  }

  function loadScores() {
    fetch('/scores')
      .then(r => r.json())
      .then(scores => {
        scoreBoard.innerHTML = '';
        scores.forEach(s => {
          const li = document.createElement('li');
          li.textContent = `${s.player_name}: ${s.score}`;
          scoreBoard.appendChild(li);
        });
      })
      .catch(err => console.error('Error loading scores:', err));
  }

  cells.forEach(cell => cell.addEventListener('click', handleCellClick));
  loadScores();
});
