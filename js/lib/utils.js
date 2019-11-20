function renderBoard(mat) {
    var strHTML = '<table border="1" cellpadding="1" class="table-container" oncontextmenu="event.preventDefault();">\n\t<tbody class="board">\n';
    for (var i = 0; i < mat.length; i++) {
        strHTML += '\t<tr>\n';
        for (var j = 0; j < mat[0].length; j++) {
            var cell = UNSHOWN;
            //if cell is mine and shown - render it as mine
            if (mat[i][j].isMine && mat[i][j].isShown) {
                cell = MINE;
                //if cell is a number larger than 0 - render it as the number
            } else if (mat[i][j].minesAroundCount > 0 && mat[i][j].isShown) {
                cell = mat[i][j].minesAroundCount
                //if cell is marked - render it as marked
            } else if (mat[i][j].minesAroundCount === 0 && mat[i][j].isShown) {
                cell = SHOWN;
            } else if (mat[i][j].isMarked) {
                cell = FLAG;
            }
            var className = 'cell cell' + i + '-' + j;
            strHTML += `<td class="${className}" oncontextmenu="cellMarked(this,${i},${j})" onclick="cellClicked(this,${i},${j})">${cell}</td>\n`;
        }
        strHTML += '</tr>\n'
    }
    strHTML += '</tbody>\n</table>';
    var elContainer = document.querySelector('.table-div');
    elContainer.innerHTML = strHTML;
}

function getNumOfMineNeighbors(board, posX, posY) {
    var neighborsCnt = 0;
    for (var i = posX - 1; i <= posX + 1; i++) {
        // if i is out of bounderies - go to the next i 
        if (i < 0 || i > board.length - 1) continue;  //continue to the next i 

        for (var j = posY - 1; j <= posY + 1; j++) {
            // if j is out of bounderies - go to the next j:
            if (j < 0 || j > board[0].length - 1) continue; // continue to the next j.

            if (i === posX && j === posY) continue; //if this is not the neighbor - but the current cell itself
            if (board[i][j].isMine) neighborsCnt++;
        }
    }
    return neighborsCnt;
}

function getRandomIntInclusive(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function renderCell(location, value) {
    // Select the elCell and set the value
    var elCell = document.querySelector(`.cell${location.i}-${location.j}`);
    elCell.innerHTML = value;
}