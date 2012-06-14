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
    var reset = function() {
        var i;
        var c;

        // initialize cells
        for (i=0; i<rows*cols; i++) {
            cells[i] = {
                x: i%cols,
                y: Math.floor(i/cols),
                filled: false,
                connect: [false, false, false, false],
                next: [],
            };
        }

        // allow each cell to refer to surround cells by direction
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

        // define the ghost home square
        i = 3*cols;
        c = cells[i];
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
    };

    var getLeftMostEmptyCells = function() {
        var x;
        var leftCells = [];
        for (x=0; x<cols; x++) {
            for (y=0; y<rows; y++) {
                var c = cells[x+y*cols];
                if (!c.filled) {
                    leftCells.push(c);
                }
            }

            if (leftCells.length > 0) {
                break;
            }
        }
        return leftCells;
    };

    var gen = function() {
    
        var cell;
        var newCell;
        var openCells;
        var numOpenCells;
        var dir;
        var size;
        var i,k;

        while (true) {
            // find all the leftmost empty cells
            openCells = getLeftMostEmptyCells();

            // stop add pieces if there are no more empty cells.
            numOpenCells = openCells.length;
            if (numOpenCells == 0) {
                break;
            }

            // choose the center cell to be a random open cell, and fill it.
            cell = openCells[getRandomInt(0,numOpenCells-1)];
            cell.filled = true;

            // only allow the piece to grow to 5 cells at most.
            size = 1;
            while (size < 5) {

                // find available open adjacent cells.
                for (k=0; k<2; k++) {

                    // clear list of open cells.
                    openCells = [];
                    numOpenCells = 0;

                    for (i=0; i<4; i++) {
                        
                        // prevent wall from going through starting position
                        if (cell.y == 6 && cell.x == 0 && i == DOWN ||
                            cell.y == 7 && cell.x == 0 && i == UP) {
                            continue;
                        }

                        // prevent long straight pieces of length 3
                        if (size == 2 && (i==dir || (i+2)%4==dir)) {
                            continue;
                        }

                        // examine an adjacent empty cell
                        if (cell.next[i] && !cell.next[i].filled) {
                            
                            // only open if the cell to the left of it is filled
                            if (cell.next[i].next[LEFT] && !cell.next[i].next[LEFT].filled) {
                            }
                            else {
                                // found an open cell
                                openCells.push(i);
                                numOpenCells++;
                            }
                        }
                    }

                    // if no open cells found from center point, then use the last cell as the new center
                    // but only do this if we are of length 2 to prevent numerous short pieces.
                    // then recalculate the open adjacent cells.
                    if (numOpenCells == 0 && size == 2) {
                        cell = newCell;
                        continue;
                    }
                    break;
                }

                // no more adjacent cells, so stop growing this piece.
                if (numOpenCells == 0) {
                    break;
                }

                // choose a random valid direction to grow.
                dir = openCells[getRandomInt(0,numOpenCells-1)];
                newCell = cell.next[dir];

                // connect the cell to the new cell.
                cell.connect[dir] = true;
                newCell.connect[(dir+2)%4] = true;

                // fill the cell
                newCell.filled = true;

                // increase the size count of this piece.
                size++;

                // Use a probability to determine when to stop growing the piece.
                if (Math.random() <= [0.10, 0.65, 0.75, 0][size-2]) {
                    break;
                }
            }
        }
    };

    reset();
    gen();
    // TODO: perhaps generate new map if a rare nonaesthetic feature is found and if no easy preventive heuristic can be found.
};
