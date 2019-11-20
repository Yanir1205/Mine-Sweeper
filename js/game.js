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
var gStartTime; //game start time in seconds
var gHintModeNegsCells = [];
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

function initGame() {
    //changing the smiley to thinker:
    stopClock();
    resetClock();
    var elBtn = document.querySelector('.new-game');
    elBtn.innerHTML = THINKER;

    gBoard = buildBoard(gLevel.size);
    // placeMines();
    // setMinesNegsCount(gBoard);
    renderBoard(gBoard); //show an empty board with an initial size of easy level

    var elBoard = document.querySelector('.table-div');
    elBoard.style.display = 'block';
    // gGame.isOn = true;

    //resetting all game variables:
    gGame.ShownCount = 0;
    gGame.markedCount = 0;

    //setting all hints to available
    initHints();
}

function startClock() { //starts a timer and adds it to the HTML
    gStartTime = Date.now(); //the start time is now
    console.log(gStartTime);
    gGame.secsPassed = 0;
    gTimerInterval = setInterval(renderTimer, 100); //every second render the timer
    var timerElem = document.querySelector('.timer'); //grabs the timer element
    timerElem.innerText = '000';

}

function resetClock() {
    var timerElem = document.querySelector('.timer'); //grabs the timer element
    timerElem.innerText = '000';
}

function renderTimer() { //renders the HTML timer element
    var timerElem = document.querySelector('.timer'); //grabs the timer element
    gGame.secsPassed += 1; //the timer model is updated
    var time = parseInt((Date.now() - gStartTime) / 1000);
    timerElem.innerText = time;
}

function stopClock() { //stops the timer and displays a message in the HTML
    console.log(`End time: \n${Date.now() - gStartTime}`);
    clearInterval(gTimerInterval);
}

function setLevel(selectedIdx) {
    //set the level of the game according to the user selection. afterwards start a new game (by init())
    console.log(selectedIdx);
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
/*
//manualy positioned mines:
gBoard[2][1].isMine = true;
gBoard[0][3].isMine = true;
gBoard[1][0].isMine = true;
gBoard[3][3].isMine = true;
*/
/*
//show all mines:
gBoard[2][1].isShown = true;
gBoard[0][3].isShown = true;
gBoard[1][0].isShown = true;
gBoard[3][3].isShown = true;
*/
/*
 // show all board:
 for (var i = 0; i < gBoard.length; i++) {
     for (var j = 0; j < gBoard.length; j++) {
         gBoard[i][j].isShown = true;
     }
 }
 */

function getRandomLocation() {
    var posX = getRandomIntInclusive(0, gLevel.size - 1);
    var posY = getRandomIntInclusive(0, gLevel.size - 1);
    return { i: posX, j: posY };
}

function cellClicked(elCell, i, j) {
    //if cell is number and not shown yet and not marked - show it!
    //if cell is mine - game over!
    var cell = gBoard[i][j];
    if (!gIsHintOn) {
        if (gGame.isOn) { //if the game is on and no hint mode
            if (!cell.isMine && !cell.isShown && !cell.isMarked) {
                if (cell.minesAroundCount > 0) {
                    cell.isShown = true;
                    gGame.ShownCount++;
                }
                else { //meaning this cell has no mines around it
                    expandShown(gBoard, elCell, i, j);
                }
                renderBoard(gBoard);
                if (checkGameOver()) {
                    endGame();
                }
            } else if (cell.isMine) {
                gameOver(elCell);
            }
        }
        else if (gGame.ShownCount === 0 && gGame.markedCount === 0) { //if this is the first click of the game - game is off and hint mode is off
            //turn the game on
            //place mines
            //count neighbors
            cell.isShown = true;
            gGame.ShownCount++;
            renderCell({ i, j }, SHOWN);
            startClock();
            gGame.isOn = true;
            //can't place a mine where user had just clicked
            placeMines();
            setMinesNegsCount(gBoard);
            //now check if this cell has mines around it or not - and decide if to expand accordingly
            if (cell.minesAroundCount === 0) { //meaning this cell has no mines around it
                expandShown(gBoard, elCell, i, j);
            }
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
        //if cell is marked - unmark it.
        //if cell is unmarked - mark it
        //check if game is over (all non-mine cells are shown and all mine-cells are marked)
        //user can't mark any cell if hint mode is on
        if (!gBoard[i][j].isShown) {
            if (gBoard[i][j].isMarked) {
                gBoard[i][j].isMarked = false;
                renderCell({ i, j }, UNSHOWN);
            }
            else {
                gBoard[i][j].isMarked = true;
                renderCell({ i, j }, FLAG);
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
                renderCell({ i, j }, SHOWN);
            }
            //if this cell is not a mine and it is not shown - show it! 
            if (!board[i][j].isMine && !board[i][j].isShown) {
                board[i][j].isShown = true;
                renderCell({ i, j }, SHOWN);
            }
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
            console.log('hint clicked!');
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
    // for (var i = posX - 1; i <= posX + 1; i++) {
    //     // if i is out of bounderies - go to the next i 
    //     if (i < 0 || i > board.length - 1) continue;  //continue to the next i 

    //     for (var j = posY - 1; j <= posY + 1; j++) {
    //         // if j is out of bounderies - go to the next j:
    //         if (j < 0 || j > board[0].length - 1) continue; // continue to the next j.

    //         if (i === posX && j === posY && !board[i][j].isShown) {
    //             //if this is not the neighbor - but the current cell itself
    //             //if the user clicked on a shown cell - leave it shown
    //             //if the user clicked on a hidden cell - unshow it!
    //             renderCell({ i, j }, UNSHOWN);
    //         }
    //         //if this cell was shown - leave it shown
    //         //if this cell was hidden - unshow it!
    //         if (!board[i][j].isShown) {
    //             renderCell({ i, j }, UNSHOWN);
    //         }
    //     }
    // }
    renderBoard(board);
    gIsHintOn = false;
    clearTimeout(gHintModeTimer);
    gHintModeTimer = null;
    turnModalOff();
}