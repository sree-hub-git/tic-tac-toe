document.addEventListener('DOMContentLoaded', () => {
  const cells = document.querySelectorAll('.cell');
  const status = document.getElementById('status');
  const scoreBoard = document.getElementById('scores');

  let board = Array(9).fill('');
  let currentPlayer = 'X';
  let gameActive = true;

  const winningConditions = [
    [0,1,2],[3,4,5],[6,7,8], // rows
    [0,3,6],[1,4,7],[2,5,8], // cols
    [0,4,8],[2,4,6]          // diags
  ];

  function handleCellClick(e) {
    const clickedCell = e.target;
    const clickedIndex = parseInt(clickedCell.getAttribute('data-index'));

    if (board[clickedIndex] !== '' || !gameActive) return;

    board[clickedIndex] = currentPlayer;
    clickedCell.textContent = currentPlayer;
    clickedCell.classList.add('disabled');

    checkResult();
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
      const playerName = prompt('Enter your name for the scoreboard:');
      if (playerName) {
        fetch('/score', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ player_name: playerName })
        })
        .then(r => r.json())
        .then(data => {
          console.log('Score saved', data);
          loadScores();
        })
        .catch(err => console.error('Error:', err));
      }
      return;
    }

    const roundDraw = !board.includes('');
    if (roundDraw) {
      status.textContent = "It's a draw!";
      gameActive = false;
    } else {
      currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
      status.textContent = `Your turn: ${currentPlayer}`;
    }
  }

  function loadScores() {
    fetch('/scores')
      .then(r => r.json())
      .then(scores => {
        scoreBoard.textContent = '';
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
