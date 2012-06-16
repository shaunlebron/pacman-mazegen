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
            no: undefined,
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
    c.connect[LEFT] = c.connect[RIGHT] = c.connect[DOWN] = true;

    i++;
    c = cells[i];
    c.filled=true;
    c.connect[LEFT] = c.connect[DOWN] = true;

    i+=cols-1;
    c = cells[i];
    c.filled=true;
    c.connect[LEFT] = c.connect[UP] = c.connect[RIGHT] = true;

    i++;
    c = cells[i];
    c.filled=true;
    c.connect[UP] = c.connect[LEFT] = true;
};

var presets = {
    'pacman':
        '^><><' +
        'm<v><' +
        '^>3rm' +
        'm7^Lw' +
        'wJvrm' +
        'm<^Lw' +
        '^><r<' +
        'm<v^>' +
        '^>w-<',
    'mspacman1': 
        '-<^><' +
        'v><v>' +
        'w<>Jr' +
        'm7>7E' +
        'wJv^L' +
        'v>w<r' +
        'w<><L' +
        'v>7r7' +
        'w<^LJ',
    'mspacman2':
        'm<^>-' +
        '^v>-7' +
        '-Jr<^' +
        'm7^>-' +
        'wJvr<' +
        'v>J^r' +
        '^>m<L' +
        'm<^v>' +
        '^><L<',
    'mspacman3':
        'v^>-7' +
        '^><v^' +
        '-<>Jv' +
        'm7v>J' +
        'wJL<v' +
        'v>7>J' +
        'w<^v>' +
        'v>7L<' +
        'w<|><',
    'mspacman4':
        '-7><v' +
        'v^v>J' +
        '^>+<r' +
        'm7^vL' +
        'wJvE<' +
        'v>J^r' +
        '^v><L' +
        '-Jv>7' +
        'v>w<^',
};

var genPreset = function(name) {
    reset();
    var p = presets[name];
    var i,c;
    for (i=0; i<rows*cols; i++) {
        c = cells[i].connect;
        switch (p[i]) {
            case '>': c[RIGHT] = true; break;
            case '<': c[LEFT] = true; break;
            case '^': c[UP] = true; break;
            case 'v': c[DOWN] = true; break;
            case 'L': c[UP] = c[RIGHT] = true; break;
            case 'r': c[DOWN] = c[RIGHT] = true; break;
            case '7': c[DOWN] = c[LEFT] = true; break;
            case 'J': c[LEFT] = c[UP] = true; break;
            case '-': c[LEFT] = c[RIGHT] = true; break;
            case '|': c[UP] = c[DOWN] = true; break;
            case 'w': c[UP] = c[LEFT] = c[RIGHT] = true; break;
            case '3': c[UP] = c[LEFT] = c[DOWN] = true; break;
            case 'm': c[LEFT] = c[DOWN] = c[RIGHT] = true; break;
            case 'E': c[DOWN] = c[RIGHT] = c[UP] = true; break;
            case '+': c[DOWN] = c[RIGHT] = c[UP] = c[LEFT] = true; break;
        }
    }
};

var isCellConnection = function(cell,key) {
    var c = cell.connect;
    switch (key) {
        case '.': return !c[UP] && !c[DOWN] && !c[LEFT] && !c[RIGHT];
        case '>': return !c[UP] && !c[DOWN] && !c[LEFT] &&  c[RIGHT];
        case '<': return !c[UP] && !c[DOWN] &&  c[LEFT] && !c[RIGHT];
        case '^': return  c[UP] && !c[DOWN] && !c[LEFT] && !c[RIGHT];
        case 'v': return !c[UP] &&  c[DOWN] && !c[LEFT] && !c[RIGHT];
        case 'L': return  c[UP] && !c[DOWN] && !c[LEFT] &&  c[RIGHT];
        case 'r': return !c[UP] &&  c[DOWN] && !c[LEFT] &&  c[RIGHT];
        case '7': return !c[UP] &&  c[DOWN] &&  c[LEFT] && !c[RIGHT];
        case 'J': return  c[UP] && !c[DOWN] &&  c[LEFT] && !c[RIGHT];
        case '-': return !c[UP] && !c[DOWN] &&  c[LEFT] &&  c[RIGHT];
        case '|': return  c[UP] &&  c[DOWN] && !c[LEFT] && !c[RIGHT];
        case 'w': return  c[UP] && !c[DOWN] &&  c[LEFT] &&  c[RIGHT];
        case '3': return  c[UP] &&  c[DOWN] &&  c[LEFT] && !c[RIGHT];
        case 'm': return !c[UP] &&  c[DOWN] &&  c[LEFT] &&  c[RIGHT];
        case 'E': return  c[UP] &&  c[DOWN] && !c[LEFT] &&  c[RIGHT];
        case '+': return  c[UP] &&  c[DOWN] &&  c[LEFT] &&  c[RIGHT];
    }
    return false;
};

var getCellConnectionKey = function(cell) {
    var c = cell.connect;
    var u = c[UP];
    var d = c[DOWN];
    var l = c[LEFT];
    var r = c[RIGHT];
    if ( !u && !d && !l && !r) return '.';
    if ( !u && !d && !l &&  r) return '>';
    if ( !u && !d &&  l && !r) return '<';
    if (  u && !d && !l && !r) return '^';
    if ( !u &&  d && !l && !r) return 'v';
    if (  u && !d && !l &&  r) return 'L';
    if ( !u &&  d && !l &&  r) return 'r';
    if ( !u &&  d &&  l && !r) return '7';
    if (  u && !d &&  l && !r) return 'J';
    if ( !u && !d &&  l &&  r) return '-';
    if (  u &&  d && !l && !r) return '|';
    if (  u && !d &&  l &&  r) return 'w';
    if (  u &&  d &&  l && !r) return '3';
    if ( !u &&  d &&  l &&  r) return 'm';
    if (  u &&  d && !l &&  r) return 'E';
    if (  u &&  d &&  l &&  r) return '+';
};

var genRandom = function() {

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
        var firstCell;
        var openCells;
        var numOpenCells;
        var dir;
        var size;
        var i,k;
        var numFilled = 0;
        var singleCount = {};
        singleCount[0] = singleCount[rows-1] = 0;

        while (true) {
            // find all the leftmost empty cells
            openCells = getLeftMostEmptyCells();

            // stop add pieces if there are no more empty cells.
            numOpenCells = openCells.length;
            if (numOpenCells == 0) {
                break;
            }

            // choose the center cell to be a random open cell, and fill it.
            firstCell = cell = openCells[getRandomInt(0,numOpenCells-1)];
            cell.filled = true;
            cell.no = numFilled++;

            // randomly allow one single-cell piece on the top or bottom of the map.
            if (cell.x < cols-1 && (cell.y in singleCount) && Math.random() <= 0.35) {
                if (singleCount[cell.y] == 0) {
                    cell.connect[cell.y == 0 ? UP : DOWN] = true;
                    singleCount[cell.y]++;
                    continue;
                }
            }

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

                var stop = false;

                // no more adjacent cells, so stop growing this piece.
                if (numOpenCells == 0) {
                    stop = true;
                }
                else {
                    // choose a random valid direction to grow.
                    dir = openCells[getRandomInt(0,numOpenCells-1)];
                    newCell = cell.next[dir];

                    // connect the cell to the new cell.
                    cell.connect[dir] = true;
                    newCell.connect[(dir+2)%4] = true;
                    if (cell.x == 0 && dir == RIGHT) {
                        cell.connect[LEFT] = true;
                    }

                    // fill the cell
                    newCell.filled = true;
                    newCell.no = numFilled++;

                    // increase the size count of this piece.
                    size++;

                    // don't let center pieces grow past 3 cells
                    if (firstCell.x == 0 && size == 3) {
                        stop = true;
                    }

                    // Use a probability to determine when to stop growing the piece.
                    if (Math.random() <= [0.10, 0.5, 0.75, 0][size-2]) {
                        stop = true;
                    }
                }

                // Close the piece.
                if (stop) {

                    if (size == 1) {
                        // This is provably a single cell piece on the right edge of the map.
                        // It must be attached to the outer wall.
                        cell.connect[RIGHT] = true;
                    }
                    else if (size == 2) {

                        // With a vertical 2-cell piece, attach to the right wall if adjacent.
                        var c = firstCell;
                        if (c.x == cols-1) {
                            if (c.connect[UP]) {
                                c.connect[RIGHT] = c.next[UP].connect[RIGHT] = true;
                            }
                            else {
                                c.connect[RIGHT] = c.next[DOWN].connect[RIGHT] = true;
                            }
                        }

                    }

                    break;
                }
            }
        }
    };

    // This is a function to detect impurities in the map that have no heuristic implemented to avoid it yet in gen().
    var isDesirable = function() {

        var c = cells[4];
        if (c.connect[UP] || c.connect[RIGHT]) {
            return false;
        }

        c = cells[rows*cols-1];
        if (c.connect[DOWN] || c.connect[RIGHT]) {
            return false;
        }
        return true;
    };

    var genCount = 0;
    do {
        reset();
        gen();
        genCount++;
    }
    while (!isDesirable());

    console.log(genCount);
};

var drawCells = function(ctx,left,top,size,title) {
    ctx.save();
    ctx.translate(left,top);

    // draw title
    ctx.font = "bold " + size/3*2 + "px sans-serif";
    ctx.textBaseline = "bottom";
    ctx.textAlign = "left";
    ctx.fillText(title, 0, -5);

    // set cell number font
    ctx.font = size/2 + "px sans-serif";
    ctx.textBaseline = "top";

    ctx.beginPath();
    for (y=0; y<=rows; y++) {
        ctx.moveTo(0,y*size);
        ctx.lineTo(cols*size,y*size);
    }
    for (x=0; x<=cols; x++) {
        ctx.moveTo(x*size,0);
        ctx.lineTo(x*size,rows*size);
    }
    ctx.lineWidth = "1";
    ctx.strokeStyle = "rgba(0,0,0,0.2)";
    ctx.stroke();

    ctx.beginPath();
    var i;
    for (i=0; i<cols*rows; i++) {
        var c = cells[i];
        var x = i % cols;
        var y = Math.floor(i / cols);

        if (c.no != undefined) {
            ctx.fillText(c.no, x*size+3, y*size+3);
        }

        if (!c.connect[UP]) {
            ctx.moveTo(x*size, y*size);
            ctx.lineTo(x*size+size, y*size);
        }
        if (!c.connect[DOWN]) {
            ctx.moveTo(x*size, y*size+size);
            ctx.lineTo(x*size+size, y*size+size);
        }
        if (!c.connect[LEFT]) {
            ctx.moveTo(x*size, y*size);
            ctx.lineTo(x*size, y*size+size);
        }
        if (!c.connect[RIGHT]) {
            ctx.moveTo(x*size+size, y*size);
            ctx.lineTo(x*size+size, y*size+size);
        }
    }
    ctx.lineWidth = "3";
    ctx.strokeStyle = "#000";
    ctx.stroke();
    ctx.restore();
};

