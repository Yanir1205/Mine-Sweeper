'use strict';

const EASY = 4;
const MEDIUM = 8;
const HARD = 12;
const MINES_NUM_EASY = 2;
const MINES_NUM_MEDIUM = 12;
const MINES_NUM_HARD = 30;
const NUM_OF_HINTS = 3;

const MINE = '💣';
const FLAG = '🚩';
const SHOWN = '🔲';
const UNSHOWN = '🔳';

const SAD_FACE = '😩';
const THINKER = '🤔';
const SMILEY = '😎';

var gTimerInterval; //interval for timer rendering
var gSafeClickTimer; //timer for safe clicks
var gStartTime; //game start time in seconds
var gHintModeTimer;
var gHints = [];
var gIsHintOn = false;
var gLevel = {
    size: EASY,
    mines: MINES_NUM_EASY
}
var gBoard = [];
var gGame = {
    isOn: false,
    ShownCount: 0,
    markedCount: 0,
    secsPassed: 0
}

var gSafeCells = []; //containing all the cells which are not shown and have no mines
var gLivesCount = 3;
var gSafeClicksCnt = 3;

function initGame() {

    //reset the clock
    stopClock();
    resetClock();
    resetSafeCellsArr();
    gSafeClicksCnt = 3;
    updateSafeClickBtn();


    gGame.isOn = false;
    updateFlagsEl(gLevel.mines);
    gLivesCount = 3;

    //changing the smiley to thinker:
    var elBtn = document.querySelector('.new-game');
    elBtn.innerHTML = THINKER;

    //building the board:
    gBoard = buildBoard(gLevel.size);
    renderBoard(gBoard); //show an empty board with an initial size of easy level
    renderLives();

    //showing the board:
    var elBoard = document.querySelector('.table-div');
    elBoard.style.display = 'block';

    //resetting all game variables:
    gGame.ShownCount = 0;
    gGame.markedCount = 0;

    //setting all hints to available
    initHints();

    //showing previous records
    showPrevRecords();
}

function safeClick(elBtn) {
    //button is enabled only if the game is on, there are safe clicks left and the timer is not active
    if (gGame.isOn && gSafeClicksCnt > 0 && !gSafeClickTimer) {
        var rndmIdx = getRandomIntInclusive(0, gSafeCells.length - 1);
        var i = gSafeCells[rndmIdx].i;
        var j = gSafeCells[rndmIdx].j;
        var location = { i, j };
        if (gSafeCells[rndmIdx].cell.minesAroundCount === 0) {
            var val = SHOWN;
        } else {
            var val = gSafeCells[rndmIdx].cell.minesAroundCount;
        }
        renderCell(location, val);
        gSafeCells.splice(rndmIdx, 1); //remove the safe cell from the array
        gSafeClicksCnt--;
        var elClicksCnt = document.querySelector('.num-of-clicks');
        elClicksCnt.innerHTML = `${gSafeClicksCnt} Safe Clicks Left`;
        gSafeClickTimer = setTimeout(hideCell, 1000, location, elBtn);
    }
    //when user clicks the safe click button
    //a random number between 0 and the gSafeClicksArr.length shall be chosen 
    //and the cell itself shall be shown for 1 second timeout
    //the safe clicks counter shall be updated in the model and the dom
    //remember to reset those value (model and dom) during initGame()
}

function hideCell(location, elBtn) {
    renderCell(location, UNSHOWN);
    clearTimeout(gSafeClickTimer);
    gSafeClickTimer = null;
    updateSafeClickBtn(elBtn)
}

function updateSafeClickBtn() {
    var elClicksCnt = document.querySelector('.num-of-clicks');
    elClicksCnt.innerHTML = `${gSafeClicksCnt} Safe Clicks Left`;
}

function updateFlagsEl(num) {
    var flagEl = document.querySelector('.flag-counter');
    if (num < 10) num = '00' + num;
    else if (num < 100) num = '0' + num;
    flagEl.innerText = num;
}

function startClock() { //starts a timer and adds it to the HTML
    gStartTime = Date.now(); //the start time is now
    gGame.secsPassed = 0;
    gTimerInterval = setInterval(renderTimer, 100); //every second render the timer
    var timerElem = document.querySelector('.timer'); //grabs the timer element
    timerElem.innerText = '000';

}

function resetClock() {
    var timerElem = document.querySelector('.timer'); //grabs the timer element
    timerElem.innerText = '000';
    gGame.secsPassed = 0;
}

function renderTimer() { //renders the HTML timer element
    var timerElem = document.querySelector('.timer'); //grabs the timer element
    var time = parseInt((Date.now() - gStartTime) / 1000);
    gGame.secsPassed = time; //the timer model is updated
    if (time < 10) time = '00' + time;
    else if (time < 100) time = '0' + time;
    timerElem.innerText = time;
}

function stopClock() { //stops the timer and displays a message in the HTML
    clearInterval(gTimerInterval);
}

function setLevel(selectedIdx) {
    //set the level of the game according to the user selection. afterwards start a new game (by init())
    switch (selectedIdx) {
        case 0:
            gLevel.size = EASY;
            gLevel.mines = MINES_NUM_EASY;
            break;
        case 1:
            gLevel.size = MEDIUM;
            gLevel.mines = MINES_NUM_MEDIUM;
            break;
        case 2:
            gLevel.size = HARD;
            gLevel.mines = MINES_NUM_HARD;
            break;
    }
    initGame();
}

function buildBoard(size) {
    var board = [];
    for (var i = 0; i < size; i++) {
        board[i] = [];
        for (var j = 0; j < size; j++) {
            board[i][j] = {
                minesAroundCount: 0, //the number of neighbors which are containing mines
                isShown: false, //true if the user left clicks this cell
                isMine: false, //true if this cell is a mine
                isMarked: false //true if the user right clicks this cell
            }
        }
    }
    return board;
}

function placeMines() {
    //randomly positioned mines:
    var i = 0;
    while (i < gLevel.mines) {
        var minePos = getRandomLocation();
        if (!gBoard[minePos.i][minePos.j].isShown && !gBoard[minePos.i][minePos.j].isMine) { //if this position is not already shown - place a mine in it and increase the number of mines placed on board
            gBoard[minePos.i][minePos.j].isMine = true;
            i++;
        }
    }
}

function cellClicked(elCell, i, j) {
    //if cell is number and not shown yet and not marked - show it!
    //if cell is mine - game over!
    var cell = gBoard[i][j];
    if (!gIsHintOn) { //hint mode is off
        if (gGame.isOn) { //if the game is on
            if (!cell.isMine && !cell.isShown && !cell.isMarked) {
                if (cell.minesAroundCount > 0) {
                    cell.isShown = true;
                    gGame.ShownCount++;
                }
                else { //meaning this cell has no mines around it
                    //expandShown(gBoard, elCell, i, j);
                    fullExpand(gBoard, i, j);
                }
                renderBoard(gBoard);
                if (checkGameOver()) {
                    endGame();
                }
            } else if (cell.isMine && !cell.isShown) {
                if (gLivesCount === 0 || gLevel.size === EASY) gameOver(elCell);
                else {
                    gLivesCount--;
                    //show the mine cell
                    gBoard[i][j].isShown = true; // ???
                    renderCell({ i, j }, MINE);
                    //render the lives counter
                    renderLives();
                }
            }
        }
        else if (gGame.ShownCount === 0 && gGame.markedCount === 0) { //if this is the first click of the game - game is off and hint mode is off
            //turn the game on
            //place mines
            //count neighbors
            cell.isShown = true;
            renderCell({ i, j }, SHOWN);
            startClock();
            gGame.isOn = true;
            //can't place a mine where user had just clicked
            placeMines();
            setMinesNegsCount(gBoard);
            //now check if this cell has mines around it or not - and decide if to expand accordingly
            if (cell.minesAroundCount === 0) { //meaning this cell has no mines around it
                gGame.ShownCount++;
                //expandShown(gBoard, elCell, i, j);
                fullExpand(gBoard, i, j);
            }
            else gGame.ShownCount++;
            initSafeCells();
            gGame.secsPassed = 0;
            renderBoard(gBoard);
        }
    }
    else if (gGame.isOn) { //hint mode is on and game is on
        //any click reveals the cell's content and its neighbors for 1 second 
        //without changing the cell's isShown property!
        //during this time - the user can't mark any cell (right click is disabled)
        //make sure all mines are already placed on board and that the number of neighbors is already set!
        if (gGame.ShownCount === 0) {
            placeMines();
            setMinesNegsCount(gBoard);
        }
        if (!cell.isShown) ShowCellsOnHintMode(gBoard, i, j);
    }
}

function initSafeCells() {
    //look for all cells that are not shown and are not mines and store inside the safe cells array
    for (var i = 0; i < gBoard.length; i++) {
        for (var j = 0; j < gBoard[i].length; j++) {
            var cell = gBoard[i][j];
            if (!cell.isMine && !cell.isShown)
                gSafeCells.push({ cell: cell, i: i, j: j });
        }
    }
}

function resetSafeCellsArr() {
    gSafeCells = [];
}

function renderLives() {
    var elLives = document.querySelector('.lives');
    elLives.innerHTML = `${gLivesCount} Lives left`;
}

function setMinesNegsCount(board) {
    for (var i = 0; i < board.length; i++) {
        for (var j = 0; j < board[i].length; j++) {
            var currCell = board[i][j];
            currCell.minesAroundCount = getNumOfMineNeighbors(board, i, j);
        }
    }
}

function gameOver(elCell) { //if the user clicked a mine
    displayAllMines();
    elCell.classList.remove('grey');
    elCell.classList.add('red');
    var elBtn = document.querySelector('.new-game');
    elBtn.innerHTML = SAD_FACE;
    gGame.isOn = false;
    stopClock();
    resetClock();
    var elModal = document.querySelector('.modal');
    elModal.innerText = 'Game Over!';
    elModal.style.display = 'block';
}

function displayAllMines() {
    for (var i = 0; i < gBoard.length; i++) {
        for (var j = 0; j < gBoard.length; j++) {
            if (gBoard[i][j].isMine && !gBoard[i][j].isShown) { //if the current cell is a mine that isn't shown - show it!
                gBoard[i][j].isShown = true;
                renderCell({ i, j }, MINE);
            }
        }
    }
}

function cellMarked(elCell, i, j) {
    if (gGame.isOn && !gIsHintOn) {
        //user can't mark an already shown cell
        //user can't mark when in hint mode
        //user can't mark when no marks are left
        //if cell is marked - unmark it.
        //if cell is unmarked - mark it
        //check if game is over (all non-mine cells are shown and all mine-cells are marked)
        //user can't mark any cell if hint mode is on
        if (!gBoard[i][j].isShown) {
            if (gBoard[i][j].isMarked) {
                gBoard[i][j].isMarked = false;
                renderCell({ i, j }, UNSHOWN);
                gGame.markedCount--;
                updateFlagsEl(gLevel.mines - gGame.markedCount);
            }
            else if (gGame.markedCount !== gLevel.mines) {
                gBoard[i][j].isMarked = true;
                renderCell({ i, j }, FLAG);
                gGame.markedCount++;
                updateFlagsEl(gLevel.mines - gGame.markedCount);
                if (checkGameOver()) { //if the user finished the game
                    endGame();
                }
            }
        }
    }
}

function checkGameOver() {
    //return false if there is a single mine that is unmarked or a single cell that is not a mine and is not shown
    for (var i = 0; i < gBoard.length; i++) {
        for (var j = 0; j < gBoard.length; j++) {
            var cell = gBoard[i][j];
            if ((cell.isMine && !cell.isMarked) || (!cell.isMine && !cell.isShown)) {
                return false;
            }
        }
    }
    return true;
}

function endGame() {
    //change the smiley to happy face
    //display a modal with a victory announcement
    //turn the game off
    var elBtn = document.querySelector('.new-game');
    elBtn.innerHTML = SMILEY;
    var elModal = document.querySelector('.modal');
    elModal.innerText = 'Victory!';
    elModal.style.display = 'block';
    stopClock();
    //check if this time is a new record for this level and if so - store it according to the current game level
    var record = checkRecord();
    displayRecord(record);
}

function checkRecord() {
    if (typeof (Storage) !== "undefined") { //browser supports local storage
        var isNew = false;
        switch (gLevel.size) {
            case EASY:
                if (localStorage.easy) { //if there is already a record under this variable
                    if (Number(localStorage.easy) > gGame.secsPassed) { //if the current time is smaller than the record time - store it!
                        localStorage.easy = gGame.secsPassed;
                        isNew = true;
                    }
                }
                else { //no record yet
                    localStorage.easy = gGame.secsPassed;
                    isNew = true;
                }
                var record = `Record: ${localStorage.easy} Sec.`;
                break;
            case MEDIUM:
                if (localStorage.medium) { //if there is already a record under this variable
                    if (Number(localStorage.medium) > gGame.secsPassed) { //if the current time is smaller than the record time - store it!
                        localStorage.medium = gGame.secsPassed;
                        isNew = true;
                    }
                }
                else { //no record yet
                    localStorage.medium = gGame.secsPassed;
                    isNew = true;
                }
                var record = `Record: ${localStorage.medium} Sec.`;
                break;
            case HARD:
                if (localStorage.hard) { //if there is already a record under this variable
                    if (Number(localStorage.hard) > gGame.secsPassed) { //if the current time is smaller than the record time - store it!
                        localStorage.hard = gGame.secsPassed;
                        isNew = true;
                    }
                }
                else { //no record yet
                    localStorage.hard = gGame.secsPassed;
                    isNew = true;
                }
                var record = `Record: ${localStorage.hard} Sec.`;
                break;
        }
    } else { //no browser support for local storage
        var record = "no support for web storage...";
    }
    return { recordStr: record, isNewRecord: isNew };
}

function displayRecord(recordData) {
    var elRecord = document.querySelector('.records');
    var strHTML = recordData.recordStr;
    if (recordData.isNew) { //if this record is new
        strHTML += ' New Record!!!'
    }
    elRecord.innerHTML = strHTML;
}

function showPrevRecords() {
    var elRecord = document.querySelector('.records');
    if (typeof (Storage) !== "undefined") { //browser supports local storage
        var record = '';
        switch (gLevel.size) {
            case EASY:
                if (localStorage.easy) { //if there is already a record under this variable
                    record = `Record: ${localStorage.easy} Sec`;
                }
                else { //no record yet
                    record = 'No record yet'
                }
                break;
            case MEDIUM:
                if (localStorage.medium) { //if there is already a record under this variable
                    record = `Record: ${localStorage.medium} Sec`;
                }
                else { //no record yet
                    record = 'No record yet'
                }
                break;
            case HARD:
                if (localStorage.hard) { //if there is already a record under this variable
                    record = `Record: ${localStorage.hard} Sec`;
                }
                else { //no record yet
                    record = 'No record yet'
                }
                break;
        }
    } else { //no browser support for local storage
        record = "no support for web storage...";
    }
    elRecord.innerHTML = record;
}

function expandShown(board, elCell, posX, posY) {
    //open the 1st degree non-mine neighbors
    for (var i = posX - 1; i <= posX + 1; i++) {
        // if i is out of bounderies - go to the next i 
        if (i < 0 || i > board.length - 1) continue;  //continue to the next i 

        for (var j = posY - 1; j <= posY + 1; j++) {
            // if j is out of bounderies - go to the next j:
            if (j < 0 || j > board[0].length - 1) continue; // continue to the next j.

            if (i === posX && j === posY) {
                //if this is not the neighbor - but the current cell itself
                board[i][j].isShown = true;
                gGame.ShownCount++;
                renderCell({ i, j }, SHOWN);
            }
            //if this cell is not a mine and it is not shown - show it! 
            if (!board[i][j].isMine && !board[i][j].isShown) {
                board[i][j].isShown = true;
                gGame.ShownCount++;
                renderCell({ i, j }, SHOWN);
            }
        }
    }
}

function fullExpand(board, posX, posY) {
    for (var i = posX - 1; i <= posX + 1; i++) {
        if (i < 0 || i > board.length - 1) continue;  //if out of boundary - continue to the next i 
        for (var j = posY - 1; j <= posY + 1; j++) {
            if (j < 0 || j > board[0].length - 1) continue; //if out of boundary - continue to the next j.
            var cell = board[i][j];
            if ((cell.minesAroundCount === 0) && !cell.isMine && !cell.isShown && !cell.isMarked) { //if cell is not already shown, not a mine and has 0 mines around it - show it
                board[i][j].isShown = true;
                gGame.ShownCount++;
                renderCell({ i, j }, SHOWN);
                //check neighbors for this cell
                fullExpand(board, i, j)
            }
            else if (cell.minesAroundCount > 0 && !cell.isMine && !cell.isShown && !cell.isMarked) { //if cell is not already shown, not a mine and has at least 1 mine around it - show it!
                board[i][j].isShown = true;
                gGame.ShownCount++;
                renderCell({ i, j }, cell.minesAroundCount);
                //fullExpand(board, i, j)
                //don't check neighbors for this cell
            }
            else if (i === posX && j === posY) continue;
        }
    }
}

function hintClicked(elImg) {
    if (gGame.isOn) {
        var hintIdx = parseInt(elImg.classList[1]);
        if (gHints[hintIdx - 1]) { //if this hint wasn't clicked before
            showHintMsg();
            elImg.src = "img/off.jpg";
            gIsHintOn = true;
        }
        gHints[hintIdx - 1] = false;
    }
    //show user modal with message that he can click on any cell to display all its neighbors content for 1 sec (and dissapear again)
    //change the image of this element - to mark that this hint is no longer available
    //remove the onclick event handler from this hint to actualy make it unavailable

}

function initHints() {
    var elImgs = document.querySelectorAll('.img');
    for (var i = 0; i < NUM_OF_HINTS; i++) {
        gHints[i] = true;
        elImgs[i].src = "img/on.jpg";
    }
    turnModalOff();
}

function showHintMsg() {
    var elModal = document.querySelector('.modal');
    elModal.innerText = 'Click on any cell to reveal it\'s content for 1 sec.';
    elModal.style.display = 'block';
}

function turnModalOff() {
    var elModal = document.querySelector('.modal');
    elModal.style.display = 'none';
}

function ShowCellsOnHintMode(board, posX, posY) {
    for (var i = posX - 1; i <= posX + 1; i++) {
        // if i is out of bounderies - go to the next i 
        if (i < 0 || i > board.length - 1) continue;  //continue to the next i 

        for (var j = posY - 1; j <= posY + 1; j++) {
            // if j is out of bounderies - go to the next j:
            if (j < 0 || j > board[0].length - 1) continue; // continue to the next j.

            if (!board[i][j].isShown) {
                var content;
                if (board[i][j].isMine) content = MINE;
                else if (board[i][j].minesAroundCount === 0) content = SHOWN;
                else if (board[i][j].minesAroundCount > 0) content = board[i][j].minesAroundCount;
                renderCell({ i, j }, content);
            }
            //if this is not the neighbor - but the current cell itself - show it anyway!
        }
        //if this cell is not shown - show it! (no matter the content!)
    }
    gHintModeTimer = setTimeout(hideCellsOnHintMode, 1000, gBoard, i, j);
}

function hideCellsOnHintMode(board, posX, posY) {
    renderBoard(board);
    gIsHintOn = false;
    clearTimeout(gHintModeTimer);
    gHintModeTimer = null;
    turnModalOff();
}