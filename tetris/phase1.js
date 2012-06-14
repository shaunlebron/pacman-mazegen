var getRandomInt = function(min,max) {
    return Math.floor(Math.random() * (max-min+1)) + min;
};

var UP = 0;
var RIGHT = 1;
var DOWN = 2;
var LEFT = 3;

var cells = [];

var rows = 9;
var cols = 5;

var genCells = function() {
    var i;
    for (i=0; i<rows*cols; i++) {
        cells[i] = {
            x: i%cols,
            y: Math.floor(i/cols),
            filled: false,
            connect: [false, false, false, false],
            next: [],
        };
    }

    for (i=0; i<rows*cols; i++) {
        var c = cells[i];
        if (c.x > 0)
            c.next[LEFT] = cells[i-1];
        if (c.x < cols - 1)
            c.next[RIGHT] = cells[i+1];
        if (c.y > 0)
            c.next[UP] = cells[i-cols];
        if (c.y < rows - 1)
            c.next[DOWN] = cells[i+cols];
    }

    var x = 0;
    var y = 3;

    var i = x+y*cols;
    var c = cells[i];
    c.filled=true;
    c.connect[RIGHT] = c.connect[DOWN] = true;

    i++;
    c = cells[i];
    c.filled=true;
    c.connect[LEFT] = c.connect[DOWN] = true;

    i+=cols-1;
    c = cells[i];
    c.filled=true;
    c.connect[UP] = c.connect[RIGHT] = true;

    i++;
    c = cells[i];
    c.filled=true;
    c.connect[UP] = c.connect[LEFT] = true;

    var getLeftMostEmptyCells = function() {
        var x;
        var leftCells = [];
        for (x=0; x<cols; x++) {
            for (y=0; y<rows; y++) {
                var c = cells[x+y*cols];
                if (!c.filled && (!c.connect[UP] || !c.connect[DOWN])) {
                    leftCells.push(c);
                }
            }

            if (leftCells.length > 0) {
                break;
            }
        }
        return leftCells;
    };

    while (true) {

        var openCells = getLeftMostEmptyCells();
        var numOpenCells = openCells.length;
        if (numOpenCells == 0) {
            break;
        }
        var cell;
        cell = openCells[getRandomInt(0,numOpenCells-1)];
        cell.filled = true;

        var j;
        var dir;
        for (j=0; j<4; j++) {

            openCells = [];
            numOpenCells = 0;
            for (i=0; i<4; i++) {
                if (j == 1 && i == dir) {
                    continue;
                }
                if (cell.next[i] && !cell.next[i].filled) {
                    if (cell.next[i].next[LEFT] && !cell.next[i].next[LEFT].filled) {
                    }
                    else {
                        openCells.push(i);
                        numOpenCells++;
                    }
                }
            }
            if (numOpenCells == 0)
                break;

            dir = openCells[getRandomInt(0,numOpenCells-1)];
            var newCell = cell.next[dir];
            cell.connect[dir] = true;
            newCell.connect[(dir+2)%4] = true;
            newCell.filled = true;

            if (j == 0) {
                cell = newCell;
            }

            if (Math.random() <= [0.10, 0.65, 0.75, 0][j]) {
                break;
            }
        }
    }
};
