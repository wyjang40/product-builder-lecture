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
    const practiceBoard = document.getElementById('practice-board');
    const practiceCount = document.getElementById('practice-count');
    const practiceQuestion = document.getElementById('practice-question');
    const practiceDescription = document.getElementById('practice-description');
    const practiceOptions = document.getElementById('practice-options');
    const practiceFeedback = document.getElementById('practice-feedback');
    const nextPracticeButton = document.getElementById('next-practice');

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
    let currentPracticeIndex = 0;

    const difficulties = {
        easy: { gridSize: 9, numMines: 10 },
        medium: { gridSize: 16, numMines: 40 },
        hard: { gridSize: 22, numMines: 99 },
    };


    const practiceItems = [
        {
            question: '1 주변에 닫힌 칸이 하나만 남았습니다. 무엇을 해야 할까요?',
            description: '숫자 1은 주변 8칸 중 지뢰가 정확히 1개라는 뜻입니다.',
            board: ['1', '1', '0', '0', '?', '0', '0', '0', '0'],
            options: ['닫힌 칸에 깃발을 표시한다', '닫힌 칸을 연다', '아무 칸이나 새로 연다'],
            answer: 0,
            feedback: '정답입니다. 숫자 1 주변에 남은 닫힌 칸이 하나뿐이면 그 칸은 지뢰입니다.',
        },
        {
            question: '숫자 2 주변에 이미 깃발 2개가 있습니다. 나머지 닫힌 칸은?',
            description: '숫자와 맞닿은 깃발 수가 이미 숫자와 같다면 남은 주변 칸은 안전합니다.',
            board: ['F', '2', 'F', '?', '?', '1', '0', '0', '0'],
            options: ['나머지 닫힌 칸을 안전하게 연다', '깃발을 하나 더 꽂는다', '무조건 새 게임을 시작한다'],
            answer: 0,
            feedback: '정답입니다. 숫자 2의 조건은 이미 깃발 2개로 충족되었으므로 다른 주변 닫힌 칸은 안전합니다.',
        },
        {
            question: '1-2-1 패턴이 닫힌 줄과 나란히 있습니다. 보통 어느 쪽이 지뢰일까요?',
            description: '전형적인 1-2-1 형태에서는 양끝 후보가 지뢰가 되는 경우가 많습니다.',
            board: ['1', '2', '1', '?', '?', '?', '0', '0', '0'],
            options: ['가운데 후보만 지뢰', '양끝 후보가 지뢰', '세 칸 모두 안전'],
            answer: 1,
            feedback: '정답입니다. 1-2-1의 가운데 숫자 2는 양쪽 지뢰를 요구하고, 양끝 1도 그 조건과 맞습니다.',
        },
        {
            question: '확정 조건을 찾지 못했습니다. 다음으로 좋은 행동은?',
            description: '찍기 전에 남은 지뢰 수, 깃발 수, 닫힌 칸 묶음을 다시 비교해야 합니다.',
            board: ['2', '?', '?', '1', '?', '2', '0', '1', '?'],
            options: ['가장 느낌이 좋은 칸을 클릭한다', '인접 숫자의 닫힌 칸 묶음을 비교한다', '모든 깃발을 지운다'],
            answer: 1,
            feedback: '정답입니다. 확률 선택 전에 인접 숫자들이 공유하는 후보 칸을 비교하면 확정 조건이 나올 수 있습니다.',
        },
    ];


    function renderPractice() {
        if (!practiceBoard || !practiceOptions || !practiceQuestion || !practiceDescription || !practiceFeedback || !practiceCount) {
            return;
        }

        const item = practiceItems[currentPracticeIndex];
        practiceCount.textContent = `문제 ${currentPracticeIndex + 1} / ${practiceItems.length}`;
        practiceQuestion.textContent = item.question;
        practiceDescription.textContent = item.description;
        practiceFeedback.textContent = '정답을 선택하면 해설이 표시됩니다.';
        practiceFeedback.classList.remove('is-correct', 'is-wrong');
        practiceBoard.innerHTML = '';
        practiceOptions.innerHTML = '';

        item.board.forEach((value) => {
            const cell = document.createElement('span');
            cell.textContent = value === '0' ? '' : value;
            cell.className = value === '?' ? 'practice-cell unknown' : 'practice-cell revealed';
            if (value === 'F') cell.className = 'practice-cell flagged';
            practiceBoard.appendChild(cell);
        });

        item.options.forEach((option, index) => {
            const button = document.createElement('button');
            button.type = 'button';
            button.textContent = option;
            button.addEventListener('click', () => checkPracticeAnswer(index));
            practiceOptions.appendChild(button);
        });
    }

    function checkPracticeAnswer(selectedIndex) {
        const item = practiceItems[currentPracticeIndex];
        const isCorrect = selectedIndex === item.answer;
        practiceFeedback.textContent = isCorrect ? item.feedback : `다시 생각해 보세요. ${item.feedback}`;
        practiceFeedback.classList.toggle('is-correct', isCorrect);
        practiceFeedback.classList.toggle('is-wrong', !isCorrect);
    }

    function nextPractice() {
        currentPracticeIndex = (currentPracticeIndex + 1) % practiceItems.length;
        renderPractice();
    }

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
        renderPractice();

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
    nextPracticeButton?.addEventListener('click', nextPractice);

    applyTheme(getPreferredTheme());
    init();
});
