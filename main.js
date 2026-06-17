document.addEventListener('DOMContentLoaded', () => {
    const difficultySelect = document.getElementById('difficulty');
    const newGameButton = document.getElementById('new-game');
    const gameBoard = document.getElementById('game-board');
    const timerElement = document.getElementById('timer');
    const mineCounterElement = document.getElementById('mine-counter');
    const themeToggle = document.getElementById('theme-toggle');

    let gridSize;
    let numMines;
    let board = [];
    let timer;
    let time = 0;
    let minesRemaining;
    let gameOver = false;

    const difficulties = {
        easy: { gridSize: 9, numMines: 10 },
        medium: { gridSize: 16, numMines: 40 },
        hard: { gridSize: 22, numMines: 99 },
    };

    function getPreferredTheme() {
        const savedTheme = localStorage.getItem('minesweeper-theme');
        if (savedTheme === 'dark' || savedTheme === 'light') {
            return savedTheme;
        }

        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    function applyTheme(theme) {
        const isDark = theme === 'dark';
        document.body.classList.toggle('dark-theme', isDark);
        document.documentElement.style.colorScheme = theme;
        themeToggle.textContent = isDark ? 'Light Mode' : 'Dark Mode';
        themeToggle.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
    }

    function toggleTheme() {
        const nextTheme = document.body.classList.contains('dark-theme') ? 'light' : 'dark';
        localStorage.setItem('minesweeper-theme', nextTheme);
        applyTheme(nextTheme);
    }

    function init() {
        const difficulty = difficultySelect.value;
        gridSize = difficulties[difficulty].gridSize;
        numMines = difficulties[difficulty].numMines;

        gameOver = false;
        time = 0;
        minesRemaining = numMines;
        clearInterval(timer);
        timerElement.textContent = `Time: ${time}s`;
        mineCounterElement.textContent = `Mines: ${minesRemaining}`;

        createBoard();
        renderBoard();
        timer = setInterval(updateTimer, 1000);
    }

    function createBoard() {
        board = Array(gridSize).fill(null).map(() => Array(gridSize).fill(null).map(() => ({
            isMine: false,
            isRevealed: false,
            isFlagged: false,
            neighborMines: 0,
        })));

        // Place mines
        let minesPlaced = 0;
        while (minesPlaced < numMines) {
            const row = Math.floor(Math.random() * gridSize);
            const col = Math.floor(Math.random() * gridSize);
            if (!board[row][col].isMine) {
                board[row][col].isMine = true;
                minesPlaced++;
            }
        }

        // Calculate neighbor mines
        for (let row = 0; row < gridSize; row++) {
            for (let col = 0; col < gridSize; col++) {
                if (board[row][col].isMine) continue;
                let count = 0;
                for (let i = -1; i <= 1; i++) {
                    for (let j = -1; j <= 1; j++) {
                        const newRow = row + i;
                        const newCol = col + j;
                        if (newRow >= 0 && newRow < gridSize && newCol >= 0 && newCol < gridSize && board[newRow][newCol].isMine) {
                            count++;
                        }
                    }
                }
                board[row][col].neighborMines = count;
            }
        }
    }

    function renderBoard() {
        gameBoard.innerHTML = '';
        gameBoard.style.gridTemplateColumns = `repeat(${gridSize}, 30px)`;
        for (let row = 0; row < gridSize; row++) {
            for (let col = 0; col < gridSize; col++) {
                const cell = document.createElement('div');
                cell.classList.add('cell');
                cell.dataset.row = row;
                cell.dataset.col = col;

                if (board[row][col].isRevealed) {
                    cell.classList.add('revealed');
                    if (board[row][col].isMine) {
                        cell.classList.add('mine');
                        cell.textContent = '💣';
                    } else if (board[row][col].neighborMines > 0) {
                        cell.textContent = board[row][col].neighborMines;
                    }
                } else if (board[row][col].isFlagged) {
                    cell.classList.add('flagged');
                    cell.textContent = '🚩';
                }

                gameBoard.appendChild(cell);
            }
        }
    }

    function updateTimer() {
        time++;
        timerElement.textContent = `Time: ${time}s`;
    }

    function revealCell(row, col) {
        if (row < 0 || row >= gridSize || col < 0 || col >= gridSize || board[row][col].isRevealed) {
            return;
        }

        board[row][col].isRevealed = true;

        if (board[row][col].neighborMines === 0 && !board[row][col].isMine) {
            for (let i = -1; i <= 1; i++) {
                for (let j = -1; j <= 1; j++) {
                    revealCell(row + i, col + j);
                }
            }
        }
    }

    function checkWin() {
        let revealedCount = 0;
        for (let row = 0; row < gridSize; row++) {
            for (let col = 0; col < gridSize; col++) {
                if (board[row][col].isRevealed) {
                    revealedCount++;
                }
            }
        }
        if (revealedCount === gridSize * gridSize - numMines) {
            gameOver = true;
            clearInterval(timer);
            alert('You win!');
        }
    }

    function endGame() {
        gameOver = true;
        clearInterval(timer);
        for (let row = 0; row < gridSize; row++) {
            for (let col = 0; col < gridSize; col++) {
                if (board[row][col].isMine) {
                    board[row][col].isRevealed = true;
                }
            }
        }
        renderBoard();
        setTimeout(() => alert('Game Over!'), 100); 
    }

    gameBoard.addEventListener('click', (e) => {
        if (gameOver) return;
        const cell = e.target;
        if (!cell.classList.contains('cell')) return;
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);

        if (board[row][col].isFlagged) return;

        if (board[row][col].isMine) {
            endGame();
        } else {
            revealCell(row, col);
            renderBoard();
            checkWin();
        }
    });

    gameBoard.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        if (gameOver) return;
        const cell = e.target;
        if (!cell.classList.contains('cell')) return;
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);

        if (board[row][col].isRevealed) return;

        board[row][col].isFlagged = !board[row][col].isFlagged;

        if (board[row][col].isFlagged) {
            minesRemaining--;
        } else {
            minesRemaining++;
        }

        mineCounterElement.textContent = `Mines: ${minesRemaining}`;
        renderBoard();
    });

    newGameButton.addEventListener('click', init);
    difficultySelect.addEventListener('change', init);
    themeToggle.addEventListener('click', toggleTheme);

    applyTheme(getPreferredTheme());
    init();
});
