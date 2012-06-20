var getRandomInt = function(min,max) {
    return Math.floor(Math.random() * (max-min+1)) + min;
};

var UP = 0;
var RIGHT = 1;
var DOWN = 2;
var LEFT = 3;

var cells = [];
var tallRows = [];
var narrowCols = [];

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
    'pacman': {
        map:
            '^><><' +
            'm<v><' +
            '^>3rm' +
            'm7^Lw' +
            'wJvrm' +
            'm<^Lw' +
            '^><r<' +
            'm<v^>' +
            '^>w-<',
        tallRows: [0,0,0,0,0],
        narrowCols: [4,4,4,4,4,4,4,4,4],
    },
    'mspacman1': {
        map:
            '-<^><' +
            'v><v>' +
            'w<>Jr' +
            'm7>7E' +
            'wJv^L' +
            'v>w<r' +
            'w<><L' +
            'v>7r7' +
            'w<^LJ',
        tallRows: [1,1,1,1,1],
        narrowCols: [4,4,4,4,4,4,4,4,4],
    },
    'mspacman2': {
        map:
            'm<^>-' +
            '^v>-7' +
            '-Jr<^' +
            'm7^>-' +
            'wJvr<' +
            'v>J^r' +
            '^>m<L' +
            'm<^v>' +
            '^><L<',
        tallRows: [1,1,4,5,5],
        narrowCols: [4,3,3,4,4,4,4,4,4],
    },
    'mspacman3': {
        map:
            'v^>-7' +
            '^><v^' +
            '-<>Jv' +
            'm7v>J' +
            'wJL<v' +
            'v>7>J' +
            'w<^v>' +
            'v>7L<' +
            'w<|><',
        tallRows: [1,1,1,1,1],
        narrowCols: [3,2,2,3,3,3,4,4,4],
    },
    'mspacman4': {
        map:
            '-7><v' +
            'v^v>J' +
            '^>+<r' +
            'm7^vL' +
            'wJvE<' +
            'v>J^r' +
            '^v><L' +
            '-Jv>7' +
            'v>w<^',
        tallRows: [1,1,0,0,0],
        narrowCols: [3,3,4,4,4,4,4,3,3],
    },
};

var genPreset = function(name) {
    reset();
    var p = presets[name];
    var i,c;
    for (i=0; i<rows*cols; i++) {
        c = cells[i].connect;
        switch (p.map[i]) {
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

    for (i=0; i<cols; i++) {
        cells[cols*p.tallRows[i]+i].raiseHeight = true;
    }
    for (i=0; i<rows; i++) {
        cells[i*cols+p.narrowCols[i]].shrinkWidth = true;
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
                        cell.isRaiseHeightCandidate = true;
                    }
                    else if (size == 2) {

                        // With a vertical 2-cell piece, attach to the right wall if adjacent.
                        var c = firstCell;
                        if (c.x == cols-1) {

                            // select the top cell
                            if (c.connect[UP]) {
                                c = c.next[UP];
                            }
                            c.connect[RIGHT] = c.next[DOWN].connect[RIGHT] = true;

                            // if there is a vertical 2-cell piece to the left of this, then
                            // join it to form a square.
                            /*
                            var c1 = c.next[LEFT];
                            var c2 = c1.next[DOWN];
                            if (!c1.connect[UP] && !c1.connect[LEFT] && c1.connect[DOWN] &&
                                !c2.connect[DOWN] && !c2.connect[LEFT] && c2.connect[UP]) {
                                c1.connect[RIGHT] = c2.connect[RIGHT] = true;
                            }
                            */
                        }

                    }

                    break;
                }
            }
        }
        setResizeCandidates();
    };


    var setResizeCandidates = function() {
        var i;
        var c,q,c2,q2;
        var x,y;
        for (i=0; i<rows*cols; i++) {
            c = cells[i];
            x = i % cols;
            y = Math.floor(i/cols);

            // determine if it has flexible height

            //
            // |_|
            //
            // or
            //  _
            // | |
            //
            q = c.connect;
            if ((c.x == 0 || !q[LEFT]) &&
                (c.x == cols-1 || !q[RIGHT]) &&
                q[UP] != q[DOWN]) {
                c.isRaiseHeightCandidate = true;
            }

            //  _ _
            // |_ _|
            //
            c2 = c.next[RIGHT];
            if (c2 != undefined) {
                q2 = c2.connect;
                if (((c.x == 0 || !q[LEFT]) && !q[UP] && !q[DOWN]) &&
                    ((c2.x == cols-1 || !q2[RIGHT]) && !q2[UP] && !q2[DOWN])
                    ) {
                    c.isRaiseHeightCandidate = c2.isRaiseHeightCandidate = true;
                }
            }

            // determine if it has flexible width

            // if cell is on the right edge with an opening to the right
            if (c.x == cols-1 && q[RIGHT]) {
                c.isShrinkWidthCandidate = true;
            }

            //  _
            // |_
            // 
            // or
            //  _
            //  _|
            //
            if ((c.y == 0 || !q[UP]) &&
                (c.y == rows-1 || !q[DOWN]) &&
                q[LEFT] != q[RIGHT]) {
                c.isShrinkWidthCandidate = true;
            }

        }
    };

    var chooseNarrowCols = function() {

        var canShrinkWidth = function(x,y) {

            // Can cause no more tight turns.
            if (y==rows-1) {
                return true;
            }

            // get the right-hand-side bound
            var x0;
            var c,c2;
            for (x0=x; x0<cols; x0++) {
                c = cells[x0+y*cols];
                c2 = c.next[DOWN]
                if (!c.connect[RIGHT] && !c2.connect[RIGHT]) {
                    break;
                }
            }

            while (c2) {

                if (c2.isShrinkWidthCandidate && canShrinkWidth(c2.x,c2.y)) {
                    c2.shrinkWidth = true;
                    narrowCols[c2.y] = c2.x;
                    return true;
                }

                // cannot proceed further without causing irreconcilable tight turns
                if (!c2.connect[LEFT] && !c2.next[UP].connect[LEFT]) {
                    break;
                }

                c2 = c2.next[LEFT];
            }

            return false;
        };

        var x;
        var c;
        for (x=cols-1; x>=0; x--) {
            c = cells[x];
            if (c.isShrinkWidthCandidate && canShrinkWidth(x,0)) {
                c.shrinkWidth = true;
                narrowCols[c.y] = c.x;
                return true;
            }
        }

        return false;
    };

    var chooseTallRows = function() {

        var canRaiseHeight = function(x,y) {

            // Can cause no more tight turns.
            if (x==cols-1) {
                return true;
            }

            // find the first cell below that will create too tight a turn on the right
            var y0;
            var c;
            var c2;
            for (y0=y; y0>=0; y0--) {
                c = cells[x+y0*cols];
                c2 = c.next[RIGHT]
                if (!c.connect[UP] && !c2.connect[UP]) {
                    break;
                }
            }

            // Proceed from the right cell upwards, looking for a cell that can be raised.
            while (c2) {

                if (c2.isRaiseHeightCandidate && canRaiseHeight(c2.x,c2.y)) {
                    c2.raiseHeight = true;
                    tallRows[c2.x] = c2.y;
                    return true;
                }

                // cannot proceed further without causing irreconcilable tight turns
                if (!c2.connect[DOWN] && !c2.next[LEFT].connect[DOWN]) {
                    break;
                }
                c2 = c2.next[DOWN];
            }

            return false;
        };

        // From the top left, examine cells below until hitting top of ghost house.
        // A raisable cell must be found before the ghost house.
        var y;
        var c;
        for (y=0; y<3; y++) {
            c = cells[y*cols];
            if (c.isRaiseHeightCandidate && canRaiseHeight(0,y)) {
                c.raiseHeight = true;
                tallRows[c.x] = c.y;
                return true;
            }
        }

        return false;
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

        if (!chooseTallRows()) {
            return false;
        }

        if (!chooseNarrowCols()) {
            return false;
        }

        return true;
    };

    // set the final position and size of each cell when upscaling the simple model to actual size
    var setUpScaleCoords = function() {
        var i,c;
        for (i=0; i<rows*cols; i++) {
            c = cells[i];
            c.final_x = c.x*3;
            if (narrowCols[c.y] < c.x) {
                c.final_x--;
            }
            c.final_y = c.y*3;
            if (tallRows[c.x] < c.y) {
                c.final_y++;
            }
            c.final_w = c.shrinkWidth ? 2 : 3;
            c.final_h = c.raiseHeight ? 4 : 3;
        }
    };

    // get rid of the tunnel paths.
    // We will create these in post process.  They only emerge here
    // in the simplified model because small blocks are only good for
    // keeping the generator rules consistent.
    var eraseTunnels = function() {
        var c = cells[2*cols-1];
        var c2;
        while (c.next[DOWN]) {
            var c2 = c.next[DOWN];
            if (c.connect[RIGHT] && c2.connect[RIGHT] && !c.connect[DOWN]) {
                c.connect[DOWN] = c2.connect[UP] = true;
            }
            c = c2;
        }
    };

    // try to generate a valid map, and keep count of tries.
    var genCount = 0;
    do {
        reset();
        gen();
        genCount++;
    }
    while (!isDesirable());

    // set helper attributes to position each cell
    setUpScaleCoords();

    // destroy some connections to hide tunnels.
    eraseTunnels();

    // print out the number of tries to generate a valid map.
    console.log(genCount);
};

var getTiles = function() {

    var tiles = [];
    var subrows = rows*3+1+3;
    var subcols = cols*3-1+2;

    var midcols = subcols-2;
    var fullcols = (subcols-2)*2;

    var setTile = function(x,y,v) {
        if (x<0 || x>subcols-1 || y<0 || y>subrows-1) {
            return;
        }
        x -= 2;
        tiles[midcols+x+y*fullcols] = v;
        tiles[midcols-1-x+y*fullcols] = v;
    };

    var getTile = function(x,y) {
        if (x<0 || x>subcols-1 || y<0 || y>subrows-1) {
            return undefined;
        }
        x -= 2;
        return tiles[midcols+x+y*fullcols];
    };

    // initialize cells
    var i;
    for (i=0; i<subrows*fullcols; i++) {
        tiles.push('_')
    }

    // set paths
    var c;
    var x,y,w,h;
    var j;
    for (i=0; i<rows*cols; i++) {

        c = cells[i];

        x = c.final_x;
        y = c.final_y+1;
        w = c.final_w;
        h = c.final_h;

        if (!c.connect[UP]) {
            for (j=0; j<w; j++) {
                setTile(x+j,y,'.');
            }
        }
        if (!c.connect[LEFT]) {
            for (j=0; j<h; j++) {
                setTile(x,y+j,'.');
            }
        }

        if (i % cols == cols-1 && !c.connect[RIGHT]) {
            for (j=0; j<h; j++) {
                setTile(x+w,y+j,'.');
            }
        }

        if (Math.floor(i/cols) == rows-1 && !c.connect[DOWN]) {
            for (j=0; j<w; j++) {
                setTile(x+j,y+h,'.');
            }
        }
    }

    var pathUp, pathDown, pathLeft, pathRight;

    // fill in path corners
    for (i=0; i<subrows*subcols; i++) {
        x = i % subcols;
        y = Math.floor(i/subcols);

        if (getTile(x,y) == '.') {
            continue;
        }

        pathUp = getTile(x,y-1) == '.' && getTile(x,y-2) == '.';
        pathDown = getTile(x,y+1) == '.' && getTile(x,y+2) == '.';
        pathRight = getTile(x+1,y) == '.' && getTile(x+2,y) == '.';
        pathLeft = getTile(x-1,y) == '.' && getTile(x-2,y) == '.';

        if ( (pathUp && pathLeft) || (pathUp && pathRight) ||
             (pathDown && pathLeft) || (pathDown && pathRight)) {
            setTile(x,y,'.');
        }
    }

    // choose tunnels
    var x;
    var minx = subcols;
    var tunnely;

    // start from center and move down
    for (y=Math.floor(subrows/2); y<subrows; y++) {
        for(x=subcols-1; getTile(x,y) == '_'; x--) {
        }
        if (getTile(x-1,y) == '.' && x < minx) {
            minx = x;
            tunnely = y;
        }
    }

    // start from center and move up
    for (y=Math.floor(subrows/2); y>=0; y--) {
        for(x=subcols-1; getTile(x,y) == '_'; x--) {
        }
        if (getTile(x-1,y) == '.' && x < minx) {
            minx = x;
            tunnely = y;
        }
    }

    // create tunnel
    for (x=minx; x<subcols+2; x++) {
        setTile(x,tunnely,'.');
    }

    // fill in walls
    for (i=0; i<subrows*subcols; i++) {
        x = i % subcols;
        y = Math.floor(i/subcols);

        if (getTile(x,y) == '.') {
            continue;
        }

        if (getTile(x-1,y) == '.' || getTile(x,y-1) == '.' || getTile(x+1,y) == '.' || getTile(x,y+1) == '.' ||
            getTile(x-1,y-1) == '.' || getTile(x+1,y-1) == '.' || getTile(x+1,y+1) == '.' || getTile(x-1,y+1) == '.') {
            setTile(x,y,'|');
        }
    }

    // create the ghost door
    setTile(2,12,'-');

    // return a tile string
    return tiles.join("");
};

var drawCells = function(ctx,left,top,size,title,
    drawRaiseHeightCandidate,
    drawRaiseHeight,
    drawShrinkWidthCandidate,
    drawShrinkWidth,
    drawNumbers) {

    ctx.save();
    ctx.translate(left,top);

    // draw title
    ctx.font = "bold " + size/3 + "px sans-serif";
    ctx.textBaseline = "bottom";
    ctx.textAlign = "left";
    ctx.fillText(title, 0, -5);

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

        // draw walls
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
    ctx.strokeStyle = "rgba(0,0,0,0.9)";
    ctx.stroke();

    // set cell number font
    ctx.font = size/3 + "px sans-serif";
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";

    var arrowsize = size/6;

    ctx.lineWidth = "3";
    for (i=0; i<cols*rows; i++) {
        var c = cells[i];
        var x = i % cols;
        var y = Math.floor(i / cols);

        if (drawRaiseHeightCandidate && c.isRaiseHeightCandidate) {
            ctx.fillStyle = "rgba(0,0,255,0.2)";
            ctx.fillRect(x*size,y*size,size,size);
        }

        if (drawShrinkWidthCandidate && c.isShrinkWidthCandidate) {
            ctx.fillStyle = "rgba(255,0,0,0.2)";
            ctx.fillRect(x*size,y*size,size,size);
        }

        if (drawRaiseHeight && c.raiseHeight) {
            ctx.beginPath();
            ctx.save();
            ctx.translate(x*size+size/2,y*size+size-arrowsize);
            ctx.moveTo(-arrowsize,-arrowsize);
            ctx.lineTo(0,0);
            ctx.lineTo(arrowsize,-arrowsize);
            ctx.strokeStyle = "rgba(0,0,255,0.7)";
            ctx.stroke();
            ctx.restore();
        }

        if (drawShrinkWidth && c.shrinkWidth) {
            ctx.beginPath();
            ctx.save();
            ctx.translate(x*size+size-arrowsize-arrowsize,y*size+size/2);
            ctx.moveTo(arrowsize,-arrowsize);
            ctx.lineTo(0,0);
            ctx.lineTo(arrowsize,arrowsize);
            ctx.restore();
            ctx.strokeStyle = "rgba(255,0,0,0.7)";
            ctx.stroke();
        }

        // draw cell number (order)
        if (drawNumbers && c.no != undefined) {
            ctx.fillStyle = "#000";
            ctx.fillText(c.no, x*size+size/2, y*size+size/2);
        }
    }

    ctx.restore();
};

var drawResult = function(ctx,left,top,size) {
    ctx.save();
    ctx.translate(left,top);

    var subsize = size / 3;
    var subrows = rows*3+1;
    var subcols = cols*3-1;

    // draw grid
    ctx.beginPath();
    var i;
    var x,y;
    for (i=0; i<=subrows; i++) {
        y = i*subsize;
        ctx.moveTo(0,y);
        ctx.lineTo(subcols*subsize,y);
    }
    for (i=0; i<=subcols; i++) {
        x = i*subsize;
        ctx.moveTo(x,0);
        ctx.lineTo(x,subrows*subsize);
    }
    ctx.lineWidth = "1";
    ctx.strokeStyle = "rgba(0,0,0,0.3)";
    ctx.stroke();

    // draw cells
    ctx.beginPath();
    var c,c0,c1,c2,c3;
    var w,h;
    for (i=0; i<rows*cols; i++) {

        c = cells[i];

        x = c.final_x*subsize;
        y = c.final_y*subsize;
        w = c.final_w*subsize;
        h = c.final_h*subsize;

        // draw walls
        if (!c.connect[UP]) {
            ctx.moveTo(x, y);
            ctx.lineTo(x+w, y);
        }
        if (!c.connect[LEFT]) {
            ctx.moveTo(x, y);
            ctx.lineTo(x, y+h);
        }
        if (!c.connect[DOWN]) {
            ctx.moveTo(x, y+h);
            ctx.lineTo(x+w, y+h);
        }
        if (!c.connect[RIGHT]) {
            ctx.moveTo(x+w, y);
            ctx.lineTo(x+w, y+h);
        }
    }
    ctx.lineWidth = "3";
    ctx.strokeStyle = "rgba(0,0,0,0.5)";
    ctx.stroke();

    ctx.restore();
};

var drawResult2 = function(ctx,left,top,size) {
    ctx.save();
    ctx.translate(left,top);

    var subsize = size / 3;
    var subrows = rows*3+1+3;
    var subcols = cols*3-1+2;

    // draw grid
    var i;
    var x,y;
    ctx.beginPath();
    for (i=0; i<=subrows; i++) {
        y = i*subsize;
        ctx.moveTo(0,y);
        ctx.lineTo(subcols*subsize,y);
    }
    for (i=0; i<=subcols; i++) {
        x = i*subsize;
        ctx.moveTo(x,0);
        ctx.lineTo(x,subrows*subsize);
    }
    ctx.lineWidth = "1";
    ctx.strokeStyle = "rgba(0,0,0,0.3)";
    ctx.stroke();

    // draw cells
    ctx.fillStyle = "rgba(0,0,0,1)";
    var c,c0,c1,c2,c3;
    var w,h;
    var j;
    ctx.beginPath();
    for (i=0; i<rows*cols; i++) {

        c = cells[i];

        x = c.final_x*subsize;
        y = c.final_y*subsize+subsize;
        w = c.final_w*subsize;
        h = c.final_h*subsize;

        // draw walls
        if (!c.connect[UP]) {
            ctx.fillRect(x,y,w,subsize);
        }
        if (!c.connect[LEFT]) {
            ctx.fillRect(x,y,subsize,h);
        }

        if (i % cols == cols-1) {
            if (!c.connect[RIGHT]) {
                ctx.fillRect(x+w,y,subsize,h);
            }
        }

        if (Math.floor(i/cols) == rows-1) {
            if (!c.connect[DOWN]) {
                ctx.fillRect(x,y+h,w,subsize);
            }
        }
    }
    ctx.lineWidth = "3";
    ctx.strokeStyle = "rgba(0,0,0,0.5)";
    ctx.stroke();

    ctx.restore();
};

var drawTiles = function(ctx,left,top,size) {
    ctx.save();
    ctx.translate(left,top);

    var subsize = size / 3;
    var subrows = rows*3+1+3;
    var subcols = cols*3-1+2;

    var fullcols = (subcols-2)*2;

    // draw grid
    var i;
    var x,y;
    ctx.beginPath();
    for (i=0; i<=subrows; i++) {
        y = i*subsize;
        ctx.moveTo(0,y);
        ctx.lineTo(fullcols*subsize,y);
    }
    for (i=0; i<=fullcols; i++) {
        x = i*subsize;
        ctx.moveTo(x,0);
        ctx.lineTo(x,subrows*subsize);
    }
    ctx.lineWidth = "1";
    ctx.strokeStyle = "rgba(0,0,0,0.3)";
    ctx.stroke();

    // draw tiles

    var tiles = getTiles();

    fillStyles = {
        '.' : 'rgba(0,0,0,0.4)',
        '|' : 'rgba(0,0,0,0.1)',
        '-' : 'rgba(0,0,0,0.0)',
        '_' : 'rgba(0,0,0,0)',
    };
    var x,y;
    var color;
    for (i=0; i<subrows*fullcols; i++) {
        x = i % fullcols;
        y = Math.floor(i/fullcols);

        ctx.fillStyle = fillStyles[tiles[i]];
        ctx.fillRect(x*subsize,y*subsize,subsize,subsize);
    }

    ctx.restore();
};
