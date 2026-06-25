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
      const aiIndex = getAIMove();
      if (aiIndex === -1) return;
      const aiCell = document.querySelector(`.cell[data-index="${aiIndex}"]`);
      board[aiIndex] = 'O';
      aiCell.textContent = 'O';
      aiCell.classList.add('machine-move');
      status.textContent = `Machine played at position ${aiIndex + 1}`;
      machineTurn = false;
      checkResult();
    } else {
      board[clickedIndex] = currentPlayer;
      clickedCell.textContent = currentPlayer;
      clickedCell.classList.add('human-move');
      status.textContent = `Your turn: ${currentPlayer}`;
      gameActive = false;
      machineTurn = true;
      checkResult();
    }
  }

  function getAIMove() {
    for (let i = 0; i < board.length; i++) {
      if (board[i] === '') return i;
    }
    return -1;
  }

  function checkWin(player) {
    for (let i = 0; i < winningConditions.length; i++) {
      const [a,b,c] = winningConditions[i];
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return board[a] === player;
      }
    }
    return false;
  }

  function checkResult() {
    let roundWon = false;
    let winner = null;
    for (let i = 0; i < winningConditions.length; i++) {
      const [a,b,c] = winningConditions[i];
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        roundWon = true;
        winner = board[a];
        break;
      }
    }

    if (roundWon) {
      if (winner === 'O') {
        status.textContent = `Machine won!`;
      } else {
        status.textContent = `You win!`;
      }
      gameActive = false;
      machineTurn = false;
      loadScores();
    } else if (!board.includes('')) {
      status.textContent = "It's a draw!";
      gameActive = false;
    } else {
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
