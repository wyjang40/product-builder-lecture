document.addEventListener('DOMContentLoaded', () => {
    const difficultySelect = document.getElementById('difficulty');
    const newGameButton = document.getElementById('new-game');
    const gameBoard = document.getElementById('game-board');
    const timerElement = document.getElementById('timer');
    const mineCounterElement = document.getElementById('mine-counter');
    const messageElement = document.getElementById('game-message');
    const themeToggle = document.getElementById('theme-toggle');
    const leaderboardList = document.getElementById('leaderboard-list');
    const clearRecordsButton = document.getElementById('clear-records');

    if (!difficultySelect || !newGameButton || !gameBoard || !timerElement || !mineCounterElement || !themeToggle) {
        return;
    }

    let gridSize;
    let numMines;
    let board = [];
    let timer;
    let time = 0;
    let minesRemaining;
    let gameOver = false;
    let firstMove = true;
    let pressTimer;
    const leaderboardKey = 'minesweeper-leaderboard-v1';

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
        themeToggle.textContent = isDark ? 'Light' : 'Dark';
        themeToggle.setAttribute('aria-label', isDark ? '밝은 모드로 전환' : '어두운 모드로 전환');
    }

    function toggleTheme() {
        const nextTheme = document.body.classList.contains('dark-theme') ? 'light' : 'dark';
        localStorage.setItem('minesweeper-theme', nextTheme);
        applyTheme(nextTheme);
    }

    function setMessage(message) {
        if (messageElement) {
            messageElement.textContent = message;
        }
    }

    function init() {
        const difficulty = difficultySelect.value;
        gridSize = difficulties[difficulty].gridSize;
        numMines = difficulties[difficulty].numMines;

        gameOver = false;
        firstMove = true;
        time = 0;
        minesRemaining = numMines;
        clearInterval(timer);
        timer = null;
        timerElement.textContent = `시간 ${time}초`;
        mineCounterElement.textContent = `지뢰 ${minesRemaining}`;
        setMessage('첫 칸을 열어보세요.');
        renderLeaderboard();

        createBoard();
        renderBoard();
    }

    function createBoard() {
        board = Array(gridSize).fill(null).map(() => Array(gridSize).fill(null).map(() => ({
            isMine: false,
            isRevealed: false,
            isFlagged: false,
            neighborMines: 0,
        })));

        let minesPlaced = 0;
        while (minesPlaced < numMines) {
            const row = Math.floor(Math.random() * gridSize);
            const col = Math.floor(Math.random() * gridSize);
            if (!board[row][col].isMine) {
                board[row][col].isMine = true;
                minesPlaced++;
            }
        }

        calculateNeighborMines();
    }

    function calculateNeighborMines() {
        for (let row = 0; row < gridSize; row++) {
            for (let col = 0; col < gridSize; col++) {
                if (board[row][col].isMine) {
                    board[row][col].neighborMines = 0;
                    continue;
                }

                let count = 0;
                for (let i = -1; i <= 1; i++) {
                    for (let j = -1; j <= 1; j++) {
                        const newRow = row + i;
                        const newCol = col + j;
                        if (isInsideBoard(newRow, newCol) && board[newRow][newCol].isMine) {
                            count++;
                        }
                    }
                }
                board[row][col].neighborMines = count;
            }
        }
    }

    function isInsideBoard(row, col) {
        return row >= 0 && row < gridSize && col >= 0 && col < gridSize;
    }

    function protectFirstMove(row, col) {
        if (!board[row][col].isMine) {
            return;
        }

        board[row][col].isMine = false;
        for (let newRow = 0; newRow < gridSize; newRow++) {
            for (let newCol = 0; newCol < gridSize; newCol++) {
                if ((newRow !== row || newCol !== col) && !board[newRow][newCol].isMine) {
                    board[newRow][newCol].isMine = true;
                    calculateNeighborMines();
                    return;
                }
            }
        }
    }

    function renderBoard() {
        gameBoard.innerHTML = '';
        gameBoard.style.gridTemplateColumns = `repeat(${gridSize}, var(--cell-size, 30px))`;

        for (let row = 0; row < gridSize; row++) {
            for (let col = 0; col < gridSize; col++) {
                const cell = document.createElement('button');
                cell.type = 'button';
                cell.className = 'cell';
                cell.dataset.row = row;
                cell.dataset.col = col;
                cell.setAttribute('role', 'gridcell');
                cell.setAttribute('aria-label', getCellLabel(row, col));

                if (board[row][col].isRevealed) {
                    cell.classList.add('revealed');
                    cell.disabled = !board[row][col].isMine;
                    if (board[row][col].isMine) {
                        cell.classList.add('mine');
                        cell.textContent = 'X';
                    } else if (board[row][col].neighborMines > 0) {
                        cell.textContent = board[row][col].neighborMines;
                    }
                } else if (board[row][col].isFlagged) {
                    cell.classList.add('flagged');
                    cell.textContent = 'F';
                }

                gameBoard.appendChild(cell);
            }
        }
    }

    function getCellLabel(row, col) {
        const cell = board[row][col];
        const position = `${row + 1}행 ${col + 1}열`;
        if (cell.isFlagged) return `${position}, 깃발 표시됨`;
        if (!cell.isRevealed) return `${position}, 닫힌 칸`;
        if (cell.isMine) return `${position}, 지뢰`;
        return `${position}, 주변 지뢰 ${cell.neighborMines}개`;
    }

    function startTimer() {
        if (timer) return;
        timer = setInterval(() => {
            time++;
            timerElement.textContent = `시간 ${time}초`;
        }, 1000);
    }

    function getLeaderboard() {
        try {
            const savedRecords = JSON.parse(localStorage.getItem(leaderboardKey));
            if (!savedRecords || typeof savedRecords !== 'object') {
                return createEmptyLeaderboard();
            }

            return Object.keys(difficulties).reduce((records, difficulty) => {
                records[difficulty] = Array.isArray(savedRecords[difficulty]) ? savedRecords[difficulty] : [];
                return records;
            }, createEmptyLeaderboard());
        } catch {
            return createEmptyLeaderboard();
        }
    }

    function createEmptyLeaderboard() {
        return Object.keys(difficulties).reduce((records, difficulty) => {
            records[difficulty] = [];
            return records;
        }, {});
    }

    function saveLeaderboard(records) {
        localStorage.setItem(leaderboardKey, JSON.stringify(records));
    }

    function getDifficultyLabel(difficulty) {
        return difficultySelect.querySelector(`option[value="${difficulty}"]`)?.textContent || difficulty;
    }

    function formatDate(dateValue) {
        return new Intl.DateTimeFormat('ko-KR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
        }).format(new Date(dateValue));
    }

    function sanitizePlayerName(name) {
        return name.trim().replace(/\s+/g, ' ').slice(0, 16) || '익명';
    }

    function recordWin() {
        const difficulty = difficultySelect.value;
        const records = getLeaderboard();
        const playerName = sanitizePlayerName(window.prompt('기록에 남길 이름을 입력하세요. 최대 16자입니다.', '플레이어') || '익명');

        records[difficulty].push({
            name: playerName,
            time,
            date: new Date().toISOString(),
        });
        records[difficulty] = records[difficulty]
            .sort((a, b) => a.time - b.time || new Date(a.date) - new Date(b.date))
            .slice(0, 20);

        saveLeaderboard(records);
        renderLeaderboard();
        const rank = records[difficulty].findIndex((record) => record.name === playerName && record.time === time) + 1;
        return rank > 0 ? rank : null;
    }

    function renderLeaderboard() {
        if (!leaderboardList) return;

        const records = getLeaderboard();
        const selectedDifficulty = difficultySelect.value;
        const selectedRecords = records[selectedDifficulty];
        leaderboardList.innerHTML = '';

        if (!selectedRecords.length) {
            const emptyItem = document.createElement('li');
            emptyItem.className = 'leaderboard-empty';
            emptyItem.textContent = `${getDifficultyLabel(selectedDifficulty)} 기록이 아직 없습니다.`;
            leaderboardList.appendChild(emptyItem);
            return;
        }

        selectedRecords.forEach((record, index) => {
            const item = document.createElement('li');
            const rank = document.createElement('span');
            const player = document.createElement('span');
            const recordTime = document.createElement('span');
            const recordDate = document.createElement('span');

            rank.className = 'rank';
            player.className = 'player';
            recordTime.className = 'record-time';
            recordDate.className = 'record-date';

            rank.textContent = index + 1;
            player.textContent = record.name;
            recordTime.textContent = `${record.time}초`;
            recordDate.textContent = formatDate(record.date);

            item.append(rank, player, recordTime, recordDate);
            leaderboardList.appendChild(item);
        });
    }

    function clearCurrentRecords() {
        const difficulty = difficultySelect.value;
        const records = getLeaderboard();
        const hasRecords = records[difficulty].length > 0;
        if (!hasRecords) return;

        if (window.confirm(`${getDifficultyLabel(difficulty)} 기록을 모두 삭제할까요?`)) {
            records[difficulty] = [];
            saveLeaderboard(records);
            renderLeaderboard();
            setMessage('현재 난이도의 기록을 초기화했습니다.');
        }
    }

    function revealCell(row, col) {
        if (!isInsideBoard(row, col) || board[row][col].isRevealed || board[row][col].isFlagged) {
            return;
        }

        board[row][col].isRevealed = true;

        if (board[row][col].neighborMines === 0 && !board[row][col].isMine) {
            for (let i = -1; i <= 1; i++) {
                for (let j = -1; j <= 1; j++) {
                    if (i !== 0 || j !== 0) {
                        revealCell(row + i, col + j);
                    }
                }
            }
        }
    }

    function handleReveal(row, col) {
        if (gameOver || board[row][col].isFlagged) return;

        if (firstMove) {
            protectFirstMove(row, col);
            firstMove = false;
            startTimer();
        }

        if (board[row][col].isMine) {
            endGame();
            return;
        }

        revealCell(row, col);
        renderBoard();
        checkWin();
    }

    function toggleFlag(row, col) {
        if (gameOver || board[row][col].isRevealed) return;

        board[row][col].isFlagged = !board[row][col].isFlagged;
        minesRemaining += board[row][col].isFlagged ? -1 : 1;
        mineCounterElement.textContent = `지뢰 ${minesRemaining}`;
        setMessage(board[row][col].isFlagged ? '깃발을 표시했습니다.' : '깃발을 제거했습니다.');
        renderBoard();
    }

    function checkWin() {
        let revealedCount = 0;
        for (let row = 0; row < gridSize; row++) {
            for (let col = 0; col < gridSize; col++) {
                if (board[row][col].isRevealed) revealedCount++;
            }
        }

        if (revealedCount === gridSize * gridSize - numMines) {
            gameOver = true;
            clearInterval(timer);
            const rank = recordWin();
            const rankMessage = rank ? ` ${rank}위 기록입니다.` : '';
            setMessage(`성공! ${time}초 만에 모든 안전 칸을 열었습니다.${rankMessage}`);
        } else {
            setMessage('좋습니다. 숫자 단서를 계속 비교하세요.');
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
        setMessage('지뢰를 열었습니다. 새 게임으로 다시 도전하세요.');
    }

    function getCellFromEvent(event) {
        const cell = event.target.closest('.cell');
        if (!cell) return null;
        return {
            row: Number.parseInt(cell.dataset.row, 10),
            col: Number.parseInt(cell.dataset.col, 10),
        };
    }

    gameBoard.addEventListener('click', (event) => {
        const cell = getCellFromEvent(event);
        if (!cell) return;
        handleReveal(cell.row, cell.col);
    });

    gameBoard.addEventListener('contextmenu', (event) => {
        event.preventDefault();
        const cell = getCellFromEvent(event);
        if (!cell) return;
        toggleFlag(cell.row, cell.col);
    });

    gameBoard.addEventListener('touchstart', (event) => {
        const cell = getCellFromEvent(event);
        if (!cell) return;
        pressTimer = setTimeout(() => {
            toggleFlag(cell.row, cell.col);
            pressTimer = null;
        }, 520);
    }, { passive: true });

    gameBoard.addEventListener('touchend', () => {
        if (pressTimer) {
            clearTimeout(pressTimer);
            pressTimer = null;
        }
    });

    gameBoard.addEventListener('keydown', (event) => {
        const cell = getCellFromEvent(event);
        if (!cell) return;

        if (event.key === 'f' || event.key === 'F') {
            event.preventDefault();
            toggleFlag(cell.row, cell.col);
        }
    });

    newGameButton.addEventListener('click', init);
    difficultySelect.addEventListener('change', init);
    themeToggle.addEventListener('click', toggleTheme);
    clearRecordsButton?.addEventListener('click', clearCurrentRecords);

    applyTheme(getPreferredTheme());
    init();
});
