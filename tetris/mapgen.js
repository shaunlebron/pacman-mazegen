var getRandomInt = function(min,max) {
    return Math.floor(Math.random() * (max-min+1)) + min;
};

var shuffle = function(list) {
    var len = list.length;
    var i,j;
    var temp;
    for (i=0; i<len; i++) {
        j = getRandomInt(0,len-1);
        temp = list[i];
        list[i] = list[j];
        list[j] = temp;
    }
};

var randomElement = function(list) {
    var len = list.length;
    if (len > 0) {
        return list[getRandomInt(0,len-1)];
    }
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
            group: undefined,
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
    var isOpenCell = function(cell,i,prevDir,size) {

        // prevent wall from going through starting position
        if (cell.y == 6 && cell.x == 0 && i == DOWN ||
            cell.y == 7 && cell.x == 0 && i == UP) {
            return false;
        }

        // prevent long straight pieces of length 3
        if (size == 2 && (i==prevDir || (i+2)%4==prevDir)) {
            return false;
        }

        // examine an adjacent empty cell
        if (cell.next[i] && !cell.next[i].filled) {
            
            // only open if the cell to the left of it is filled
            if (cell.next[i].next[LEFT] && !cell.next[i].next[LEFT].filled) {
            }
            else {
                return true;
            }
        }

        return false;
    };
    var getOpenCells = function(cell,prevDir,size) {
        var openCells = [];
        var numOpenCells = 0;
        for (i=0; i<4; i++) {
            if (isOpenCell(cell,i,prevDir,size)) {
                openCells.push(i);
                numOpenCells++;
            }
        }
        return { openCells: openCells, numOpenCells: numOpenCells };
    };
    var connectCell = function(cell,dir) {
        cell.connect[dir] = true;
        cell.next[dir].connect[(dir+2)%4] = true;
        if (cell.x == 0 && dir == RIGHT) {
            cell.connect[LEFT] = true;
        }
    };

    var gen = function() {
    
        var cell;      // cell at the center of growth (open cells are chosen around this cell)
        var newCell;   // most recent cell filled
        var firstCell; // the starting cell of the current group

        var openCells;    // list of open cells around the center cell
        var numOpenCells; // size of openCells

        var dir; // the most recent direction of growth relative to the center cell
        var i;   // loop control variable used for iterating directions

        var numFilled = 0;  // current count of total cells filled
        var numGroups;      // current count of cell groups created
        var size;           // current number of cells in the current group
        var probStopGrowingAtSize = [ // probability of stopping growth at sizes...
                0,     // size 0
                0,     // size 1
                0.10,  // size 2
                0.5,   // size 3
                0.75,  // size 4
                1];    // size 5

        // A single cell group of size 1 is allowed at each row at y=0 and y=rows-1,
        // so keep count of those created.
        var singleCount = {};
        singleCount[0] = singleCount[rows-1] = 0;
        var probTopAndBotSingleCellJoin = 0.35;

        // A count and limit of the number long pieces (i.e. an "L" of size 4 or "T" of size 5)
        var longPieces = 0;
        var maxLongPieces = 1;
        var probExtendAtSize2 = 1;
        var probExtendAtSize3or4 = 0.5;

        var fillCell = function(cell) {
            cell.filled = true;
            cell.no = numFilled++;
            cell.group = numGroups;
        };

        for (numGroups=0; ; numGroups++) {

            // find all the leftmost empty cells
            openCells = getLeftMostEmptyCells();

            // stop add pieces if there are no more empty cells.
            numOpenCells = openCells.length;
            if (numOpenCells == 0) {
                break;
            }

            // choose the center cell to be a random open cell, and fill it.
            firstCell = cell = openCells[getRandomInt(0,numOpenCells-1)];
            fillCell(cell);

            // randomly allow one single-cell piece on the top or bottom of the map.
            if (cell.x < cols-1 && (cell.y in singleCount) && Math.random() <= probTopAndBotSingleCellJoin) {
                if (singleCount[cell.y] == 0) {
                    cell.connect[cell.y == 0 ? UP : DOWN] = true;
                    singleCount[cell.y]++;
                    continue;
                }
            }

            // number of cells in this contiguous group
            size = 1;

            if (cell.x == cols-1) {
                // if the first cell is at the right edge, then don't grow it.
                cell.connect[RIGHT] = true;
                cell.isRaiseHeightCandidate = true;
            }
            else {
                // only allow the piece to grow to 5 cells at most.
                while (size < 5) {

                    var stop = false;

                    if (size == 2) {
                        // With a horizontal 2-cell group, try to turn it into a 4-cell "L" group.
                        // This is done here because this case cannot be reached when a piece has already grown to size 3.
                        var c = firstCell;
                        if (c.x > 0 && c.connect[RIGHT] && c.next[RIGHT] && c.next[RIGHT].next[RIGHT]) {
                            if (longPieces < maxLongPieces && Math.random() <= probExtendAtSize2) {

                                c = c.next[RIGHT].next[RIGHT];
                                var dirs = {};
                                if (isOpenCell(c,UP)) {
                                    dirs[UP] = true;
                                }
                                if (isOpenCell(c,DOWN)) {
                                    dirs[DOWN] = true;
                                }

                                if (dirs[UP] && dirs[DOWN]) {
                                    i = [UP,DOWN][getRandomInt(0,1)];
                                }
                                else if (dirs[UP]) {
                                    i = UP;
                                }
                                else if (dirs[DOWN]) {
                                    i = DOWN;
                                }
                                else {
                                    i = undefined;
                                }

                                if (i != undefined) {
                                    connectCell(c,LEFT);
                                    fillCell(c);
                                    connectCell(c,i);
                                    fillCell(c.next[i]);
                                    longPieces++;
                                    size+=2;
                                    stop = true;
                                }
                            }
                        }
                    }

                    if (!stop) {
                        // find available open adjacent cells.
                        var result = getOpenCells(cell,dir,size);
                        openCells = result['openCells'];
                        numOpenCells = result['numOpenCells'];

                        // if no open cells found from center point, then use the last cell as the new center
                        // but only do this if we are of length 2 to prevent numerous short pieces.
                        // then recalculate the open adjacent cells.
                        if (numOpenCells == 0 && size == 2) {
                            cell = newCell;
                            result = getOpenCells(cell,dir,size);
                            openCells = result['openCells'];
                            numOpenCells = result['numOpenCells'];
                        }

                        // no more adjacent cells, so stop growing this piece.
                        if (numOpenCells == 0) {
                            stop = true;
                        }
                        else {
                            // choose a random valid direction to grow.
                            dir = openCells[getRandomInt(0,numOpenCells-1)];
                            newCell = cell.next[dir];

                            // connect the cell to the new cell.
                            connectCell(cell,dir);

                            // fill the cell
                            fillCell(newCell);

                            // increase the size count of this piece.
                            size++;

                            // don't let center pieces grow past 3 cells
                            if (firstCell.x == 0 && size == 3) {
                                stop = true;
                            }

                            // Use a probability to determine when to stop growing the piece.
                            if (Math.random() <= probStopGrowingAtSize[size]) {
                                stop = true;
                            }
                        }
                    }

                    // Close the piece.
                    if (stop) {

                        if (size == 1) {
                            // This is provably impossible because this loop is never entered with size==1.
                        }
                        else if (size == 2) {

                            // With a vertical 2-cell group, attach to the right wall if adjacent.
                            var c = firstCell;
                            if (c.x == cols-1) {

                                // select the top cell
                                if (c.connect[UP]) {
                                    c = c.next[UP];
                                }
                                c.connect[RIGHT] = c.next[DOWN].connect[RIGHT] = true;
                            }
                            
                        }
                        else if (size == 3 || size == 4) {

                            // Try to extend group to have a long leg
                            if (longPieces < maxLongPieces && firstCell.x > 0 && Math.random() <= probExtendAtSize3or4) {
                                var dirs = [];
                                var dirsLength = 0;
                                for (i=0; i<4; i++) {
                                    if (cell.connect[i] && isOpenCell(cell.next[i],i)) {
                                        dirs.push(i);
                                        dirsLength++;
                                    }
                                }
                                if (dirsLength > 0) {
                                    i = dirs[getRandomInt(0,dirsLength-1)];
                                    c = cell.next[i];
                                    connectCell(c,i);
                                    fillCell(c.next[i]);
                                    longPieces++;
                                }
                            }
                        }

                        break;
                    }
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

    // Identify if a cell is the center of a cross.
    var cellIsCrossCenter = function(c) {
        return c.connect[UP] && c.connect[RIGHT] && c.connect[DOWN] && c.connect[LEFT];
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
                if ((!c.connect[RIGHT] || cellIsCrossCenter(c)) &&
                    (!c2.connect[RIGHT] || cellIsCrossCenter(c2))) {
                    break;
                }
            }

            // build candidate list
            var candidates = [];
            var numCandidates = 0;
            for (; c2; c2=c2.next[LEFT]) {
                if (c2.isShrinkWidthCandidate) {
                    candidates.push(c2);
                    numCandidates++;
                }

                // cannot proceed further without causing irreconcilable tight turns
                if ((!c2.connect[LEFT] || cellIsCrossCenter(c2)) &&
                    (!c2.next[UP].connect[LEFT] || cellIsCrossCenter(c2.next[UP]))) {
                    break;
                }
            }
            shuffle(candidates);

            var i;
            for (i=0; i<numCandidates; i++) {
                c2 = candidates[i];
                if (canShrinkWidth(c2.x,c2.y)) {
                    c2.shrinkWidth = true;
                    narrowCols[c2.y] = c2.x;
                    return true;
                }
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
                if ((!c.connect[UP] || cellIsCrossCenter(c)) && 
                    (!c2.connect[UP] || cellIsCrossCenter(c2))) {
                    break;
                }
            }

            // Proceed from the right cell upwards, looking for a cell that can be raised.
            var candidates = [];
            var numCandidates = 0;
            for (; c2; c2=c2.next[DOWN]) {
                if (c2.isRaiseHeightCandidate) {
                    candidates.push(c2);
                    numCandidates++;
                }

                // cannot proceed further without causing irreconcilable tight turns
                if ((!c2.connect[DOWN] || cellIsCrossCenter(c2)) &&
                    (!c2.next[LEFT].connect[DOWN] || cellIsCrossCenter(c2.next[LEFT]))) {
                    break;
                }
            }
            shuffle(candidates);

            var i;
            for (i=0; i<numCandidates; i++) {
                c2 = candidates[i];
                if (canRaiseHeight(c2.x,c2.y)) {
                    c2.raiseHeight = true;
                    tallRows[c2.x] = c2.y;
                    return true;
                }
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

        // ensure a solid top right corner
        var c = cells[4];
        if (c.connect[UP] || c.connect[RIGHT]) {
            return false;
        }

        // ensure a solid bottom right corner
        c = cells[rows*cols-1];
        if (c.connect[DOWN] || c.connect[RIGHT]) {
            return false;
        }

        // ensure there are no two stacked/side-by-side 2-cell pieces.
        var isHori = function(x,y) {
            var q1 = cells[x+y*cols].connect;
            var q2 = cells[x+1+y*cols].connect;
            return !q1[UP] && !q1[DOWN] && (x==0 || !q1[LEFT]) && q1[RIGHT] && 
                   !q2[UP] && !q2[DOWN] && q2[LEFT] && !q2[RIGHT];
        };
        var isVert = function(x,y) {
            var q1 = cells[x+y*cols].connect;
            var q2 = cells[x+(y+1)*cols].connect;
            if (x==cols-1) {
                // special case (we can consider two single cells as vertical at the right edge)
                return !q1[LEFT] && !q1[UP] && !q1[DOWN] &&
                       !q2[LEFT] && !q2[UP] && !q2[DOWN];
            }
            return !q1[LEFT] && !q1[RIGHT] && !q1[UP] && q1[DOWN] && 
                   !q2[LEFT] && !q2[RIGHT] && q2[UP] && !q2[DOWN];
        };
        var x,y;
        var g;
        for (y=0; y<rows-1; y++) {
            for (x=0; x<cols-1; x++) {
                if (isHori(x,y) && isHori(x,y+1) ||
                    isVert(x,y) && isVert(x+1,y)) {

                    // don't allow them in the middle because they'll be two large when reflected.
                    if (x==0) {
                        return false;
                    }

                    // Join the four cells to create a square.
                    cells[x+y*cols].connect[DOWN] = true;
                    cells[x+y*cols].connect[RIGHT] = true;
                    g = cells[x+y*cols].group;

                    cells[x+1+y*cols].connect[DOWN] = true;
                    cells[x+1+y*cols].connect[LEFT] = true;
                    cells[x+1+y*cols].group = g;

                    cells[x+(y+1)*cols].connect[UP] = true;
                    cells[x+(y+1)*cols].connect[RIGHT] = true;
                    cells[x+(y+1)*cols].group = g;

                    cells[x+1+(y+1)*cols].connect[UP] = true;
                    cells[x+1+(y+1)*cols].connect[LEFT] = true;
                    cells[x+1+(y+1)*cols].group = g;
                }
            }
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

    var reassignGroup = function(oldg,newg) {
        var i;
        var c;
        for (i=0; i<rows*cols; i++) {
            c = cells[i];
            if (c.group == oldg) {
                c.group = newg;
            }
        }
    };

    var createTunnels = function() {

        // declare candidates
        var singleDeadEndCells = [];
        var topSingleDeadEndCells = [];
        var botSingleDeadEndCells = [];

        var voidTunnelCells = [];
        var topVoidTunnelCells = [];
        var botVoidTunnelCells = [];

        var edgeTunnelCells = [];
        var topEdgeTunnelCells = [];
        var botEdgeTunnelCells = [];

        var doubleDeadEndCells = [];

        var numTunnelsCreated = 0;

        // prepare candidates
        var y;
        var c;
        var upDead;
        var downDead;
        for (y=0; y<rows; y++) {
            c = cells[cols-1+y*cols];
            if (c.connect[UP]) {
                continue;
            }
            if (c.y > 1 && c.y < rows-2) {
                c.isEdgeTunnelCandidate = true;
                edgeTunnelCells.push(c);
                if (c.y <= 2) {
                    topEdgeTunnelCells.push(c);
                }
                else if (c.y >= 5) {
                    botEdgeTunnelCells.push(c);
                }
            }
            upDead = (!c.next[UP] || c.next[UP].connect[RIGHT]);
            downDead = (!c.next[DOWN] || c.next[DOWN].connect[RIGHT]);
            if (c.connect[RIGHT]) {
                if (upDead) {
                    c.isVoidTunnelCandidate = true;
                    voidTunnelCells.push(c);
                    if (c.y <= 2) {
                        topVoidTunnelCells.push(c);
                    }
                    else if (c.y >= 6) {
                        botVoidTunnelCells.push(c);
                    }
                }
            }
            else {
                if (c.connect[DOWN]) {
                    continue;
                }
                if (upDead != downDead) {
                    if (!c.raiseHeight && y < rows-1 && !c.next[LEFT].connect[LEFT]) {
                        singleDeadEndCells.push(c);
                        c.isSingleDeadEndCandidate = true;
                        c.singleDeadEndDir = upDead ? UP : DOWN;
                        var offset = upDead ? 1 : 0;
                        if (c.y <= 1+offset) {
                            topSingleDeadEndCells.push(c);
                        }
                        else if (c.y >= 5+offset) {
                            botSingleDeadEndCells.push(c);
                        }
                    }
                }
                else if (upDead && downDead) {
                    if (y > 0 && y < rows-1) {
                        if (c.next[LEFT].connect[UP] && c.next[LEFT].connect[DOWN]) {
                            c.isDoubleDeadEndCandidate = true;
                            if (c.y >= 2 && c.y <= 5) {
                                doubleDeadEndCells.push(c);
                            }
                        }
                    }
                }
            }
        }

        // choose tunnels from candidates
        var numTunnelsDesired = Math.random() <= 0.45 ? 2 : 1;
        var c;
        var selectSingleDeadEnd = function(c) {
            c.connect[RIGHT] = true;
            if (c.singleDeadEndDir == UP) {
                c.topTunnel = true;
            }
            else {
                c.next[DOWN].topTunnel = true;
            }
        };
        if (numTunnelsDesired == 1) {
            if (c = randomElement(voidTunnelCells)) {
                c.topTunnel = true;
            }
            else if (c = randomElement(singleDeadEndCells)) {
                selectSingleDeadEnd(c);
            }
            else if (c = randomElement(edgeTunnelCells)) {
                c.topTunnel = true;
            }
            else {
                return false;
            }
        }
        else if (numTunnelsDesired == 2) {
            if (c = randomElement(doubleDeadEndCells)) {
                c.connect[RIGHT] = true;
                c.topTunnel = true;
                c.next[DOWN].topTunnel = true;
            }
            else {
                numTunnelsCreated = 1;
                if (c = randomElement(topVoidTunnelCells)) {
                    c.topTunnel = true;
                }
                else if (c = randomElement(topSingleDeadEndCells)) {
                    selectSingleDeadEnd(c);
                }
                else if (c = randomElement(topEdgeTunnelCells)) {
                    c.topTunnel = true;
                }
                else {
                    // could not find a top tunnel opening
                    numTunnelsCreated = 0;
                }

                if (c = randomElement(botVoidTunnelCells)) {
                    c.topTunnel = true;
                }
                else if (c = randomElement(botSingleDeadEndCells)) {
                    selectSingleDeadEnd(c);
                }
                else if (c = randomElement(botEdgeTunnelCells)) {
                    c.topTunnel = true;
                }
                else {
                    // could not find a bottom tunnel opening
                    if (numTunnelsCreated == 0) {
                        return false;
                    }
                }
            }
        }

        // don't allow a horizontal path to cut straight through a map (through tunnels)
        var exit,topy;
        for (y=0; y<rows; y++) {
            c = cells[cols-1+y*cols];
            if (c.topTunnel) {
                exit = true;
                topy = c.final_y;
                while (c.next[LEFT]) {
                    c = c.next[LEFT];
                    if (!c.connect[UP] && c.final_y == topy) {
                        continue;
                    }
                    else {
                        exit = false;
                        break;
                    }
                }
                if (exit) {
                    return false;
                }
            }
        }

        // clear unused void tunnels (dead ends)
        var len = voidTunnelCells.length;
        var i;

        var replaceGroup = function(oldg,newg) {
            var i,c;
            for (i=0; i<rows*cols; i++) {
                c = cells[i];
                if (c.group == oldg) {
                    c.group = newg;
                }
            }
        };
        for (i=0; i<len; i++) {
            c = voidTunnelCells[i];
            if (!c.topTunnel) {
                replaceGroup(c.group, c.next[UP].group);
                c.connect[UP] = true;
                c.next[UP].connect[DOWN] = true;
            }
        }

        return true;
    };

    var joinWalls = function() {

        // randomly join wall pieces to the boundary to increase difficulty

        var x,y;
        var c;

        // join cells to the top boundary
        for (x=0; x<cols; x++) {
            c = cells[x];
            if (!c.connect[LEFT] && !c.connect[RIGHT] && !c.connect[UP] &&
                (!c.connect[DOWN] || !c.next[DOWN].connect[DOWN])) {

                // ensure it will not create a dead-end
                if ((!c.next[LEFT] || !c.next[LEFT].connect[UP]) &&
                    (c.next[RIGHT] && !c.next[RIGHT].connect[UP])) {

                    // prevent connecting very large piece
                    if (!(c.next[DOWN] && c.next[DOWN].connect[RIGHT] && c.next[DOWN].next[RIGHT].connect[RIGHT])) {
                        c.isJoinCandidate = true;
                        if (Math.random() <= 0.25) {
                            c.connect[UP] = true;
                        }
                    }
                }
            }
        }

        // join cells to the bottom boundary
        for (x=0; x<cols; x++) {
            c = cells[x+(rows-1)*cols];
            if (!c.connect[LEFT] && !c.connect[RIGHT] && !c.connect[DOWN] &&
                (!c.connect[UP] || !c.next[UP].connect[UP])) {

                // ensure it will not creat a dead-end
                if ((!c.next[LEFT] || !c.next[LEFT].connect[DOWN]) &&
                    (c.next[RIGHT] && !c.next[RIGHT].connect[DOWN])) {

                    // prevent connecting very large piece
                    if (!(c.next[UP] && c.next[UP].connect[RIGHT] && c.next[UP].next[RIGHT].connect[RIGHT])) {
                        c.isJoinCandidate = true;
                        if (Math.random() <= 0.25) {
                            c.connect[DOWN] = true;
                        }
                    }
                }
            }
        }

        // join cells to the right boundary
        var c2;
        for (y=1; y<rows-1; y++) {
            c = cells[cols-1+y*cols];
            if (c.raiseHeight) {
                continue;
            }
            if (!c.connect[RIGHT] && !c.connect[UP] && !c.connect[DOWN] &&
                !c.next[UP].connect[RIGHT] && !c.next[DOWN].connect[RIGHT]) {
                if (c.connect[LEFT]) {
                    c2 = c.next[LEFT];
                    if (!c2.connect[UP] && !c2.connect[DOWN] && !c2.connect[LEFT]) {
                        c.isJoinCandidate = true;
                        if (Math.random() <= 0.5) {
                            c.connect[RIGHT] = true;
                        }
                    }
                }
            }
        }
    };

    // try to generate a valid map, and keep count of tries.
    var genCount = 0;
    while (true) {
        reset();
        gen();
        genCount++;
        if (!isDesirable()) {
            continue;
        }

        setUpScaleCoords();
        joinWalls();
        if (!createTunnels()) {
            continue;
        }

        break;
    }

};

// Transform the simple cells to a tile array used for creating the map.
var getTiles = function() {

    var tiles = []; // each is a character indicating a wall(|), path(.), or blank(_).
    var tileCells = []; // maps each tile to a specific cell of our simple map
    var subrows = rows*3+1+3;
    var subcols = cols*3-1+2;

    var midcols = subcols-2;
    var fullcols = (subcols-2)*2;

    // getter and setter for tiles (ensures vertical symmetry axis)
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

    // getter and setter for tile cells
    var setTileCell = function(x,y,cell) {
        if (x<0 || x>subcols-1 || y<0 || y>subrows-1) {
            return;
        }
        x -= 2;
        tileCells[x+y*subcols] = cell;
    };
    var getTileCell = function(x,y) {
        if (x<0 || x>subcols-1 || y<0 || y>subrows-1) {
            return undefined;
        }
        x -= 2;
        return tileCells[x+y*subcols];
    };

    // initialize tiles
    var i;
    for (i=0; i<subrows*fullcols; i++) {
        tiles.push('_');
    }
    for (i=0; i<subrows*subcols; i++) {
        tileCells.push(undefined);
    }

    // set tile cells
    var c;
    var x,y,w,h;
    var x0,y0;
    for (i=0; i<rows*cols; i++) {
        c = cells[i];
        for (x0=0; x0<c.final_w; x0++) {
            for (y0=0; y0<c.final_h; y0++) {
                setTileCell(c.final_x+x0,c.final_y+1+y0,c);
            }
        }
    }

    // set path tiles
    var cl, cu;
    for (y=0; y<subrows; y++) {
        for (x=0; x<subcols; x++) {
            c = getTileCell(x,y); // cell
            cl = getTileCell(x-1,y); // left cell
            cu = getTileCell(x,y-1); // up cell

            if (c) {
                // inside map
                if (cl && c.group != cl.group || // at vertical boundary
                    cu && c.group != cu.group || // at horizontal boundary
                    !cu && !c.connect[UP]) { // at top boundary
                    setTile(x,y,'.');
                }
            }
            else {
                // outside map
                if (cl && (!cl.connect[RIGHT] || getTile(x-1,y) == '.') || // at right boundary
                    cu && (!cu.connect[DOWN] || getTile(x,y-1) == '.')) { // at bottom boundary
                    setTile(x,y,'.');
                }
            }

            // at corner connecting two paths
            if (getTile(x-1,y) == '.' && getTile(x,y-1) == '.' && getTile(x-1,y-1) == '_') {
                setTile(x,y,'.');
            }
        }
    }

    // extend tunnels
    var y;
    for (c=cells[cols-1]; c; c = c.next[DOWN]) {
        if (c.topTunnel) {
            y = c.final_y+1;
            setTile(subcols-1, y,'.');
            setTile(subcols-2, y,'.');
        }
    }

    // fill in walls
    for (y=0; y<subrows; y++) {
        for (x=0; x<subcols; x++) {
            // any blank tile that shares a vertex with a path tile should be a wall tile
            if (getTile(x,y) != '.' && (getTile(x-1,y) == '.' || getTile(x,y-1) == '.' || getTile(x+1,y) == '.' || getTile(x,y+1) == '.' ||
                getTile(x-1,y-1) == '.' || getTile(x+1,y-1) == '.' || getTile(x+1,y+1) == '.' || getTile(x-1,y+1) == '.')) {
                setTile(x,y,'|');
            }
        }
    }

    // create the ghost door
    setTile(2,12,'-');

    // set energizers
    var getTopEnergizerRange = function() {
        var miny;
        var maxy = subrows/2;
        var x = subcols-2;
        var y;
        for (y=2; y<maxy; y++) {
            if (getTile(x,y) == '.' && getTile(x,y+1) == '.') {
                miny = y+1;
                break;
            }
        }
        maxy = Math.min(maxy,miny+7);
        for (y=miny+1; y<maxy; y++) {
            if (getTile(x-1,y) == '.') {
                maxy = y-1;
                break;
            }
        }
        return {miny:miny, maxy:maxy};
    };
    var getBotEnergizerRange = function() {
        var miny = subrows/2;
        var maxy;
        var x = subcols-2;
        var y;
        for (y=subrows-3; y>=miny; y--) {
            if (getTile(x,y) == '.' && getTile(x,y+1) == '.') {
                maxy = y;
                break;
            }
        }
        miny = Math.max(miny,maxy-7);
        for (y=maxy-1; y>miny; y--) {
            if (getTile(x-1,y) == '.') {
                miny = y+1;
                break;
            }
        }
        return {miny:miny, maxy:maxy};
    };
    var x = subcols-2;
    var y;
    var range;
    if (range = getTopEnergizerRange()) {
        y = getRandomInt(range.miny, range.maxy);
        setTile(x,y,'o');
    }
    if (range = getBotEnergizerRange()) {
        y = getRandomInt(range.miny, range.maxy);
        setTile(x,y,'o');
    }

    // erase pellets in the tunnels
    var eraseUntilIntersection = function(x,y) {
        var adj;
        while (true) {
            adj = [];
            if (getTile(x-1,y) == '.') {
                adj.push({x:x-1,y:y});
            }
            if (getTile(x+1,y) == '.') {
                adj.push({x:x+1,y:y});
            }
            if (getTile(x,y-1) == '.') {
                adj.push({x:x,y:y-1});
            }
            if (getTile(x,y+1) == '.') {
                adj.push({x:x,y:y+1});
            }
            if (adj.length == 1) {
                setTile(x,y,' ');
                x = adj[0].x;
                y = adj[0].y;
            }
            else {
                break;
            }
        }
    };
    x = subcols-1;
    for (y=0; y<subrows; y++) {
        if (getTile(x,y) == '.') {
            eraseUntilIntersection(x,y);
        }
    }

    // erase pellets on starting position
    setTile(1,subrows-8,' ');

    // erase pellets around the ghost house
    var i,j;
    var y;
    for (i=0; i<7; i++) {

        // erase pellets from bottom of the ghost house proceeding down until
        // reaching a pellet tile that isn't surround by walls
        // on the left and right
        y = subrows-14;
        setTile(i, y, ' ');
        j = 1;
        while (getTile(i,y+j) == '.' &&
                getTile(i-1,y+j) == '|' &&
                getTile(i+1,y+j) == '|') {
            setTile(i,y+j,' ');
            j++;
        }

        // erase pellets from top of the ghost house proceeding up until
        // reaching a pellet tile that isn't surround by walls
        // on the left and right
        y = subrows-20;
        setTile(i, y, ' ');
        j = 1;
        while (getTile(i,y-j) == '.' &&
                getTile(i-1,y-j) == '|' &&
                getTile(i+1,y-j) == '|') {
            setTile(i,y-j,' ');
            j++;
        }
    }
    // erase pellets on the side of the ghost house
    for (i=0; i<7; i++) {

        // erase pellets from side of the ghost house proceeding right until
        // reaching a pellet tile that isn't surround by walls
        // on the top and bottom.
        x = 6;
        y = subrows-14-i;
        setTile(x, y, ' ');
        j = 1;
        while (getTile(x+j,y) == '.' &&
                getTile(x+j,y-1) == '|' &&
                getTile(x+j,y+1) == '|') {
            setTile(x+j,y,' ');
            j++;
        }
    }

    // return a tile string (3 empty lines on top and 2 on bottom)
    return (
        "____________________________" +
        "____________________________" +
        "____________________________" +
        tiles.join("") +
        "____________________________" +
        "____________________________");
};

var randomColor = function() {
    return '#'+('00000'+(Math.random()*(1<<24)|0).toString(16)).slice(-6);
};

var drawCells = function(ctx,left,top,size,title,options) {

    ctx.save();
    ctx.translate(left,top);

    // draw title
    ctx.font = "bold " + size/3 + "px sans-serif";
    ctx.textBaseline = "bottom";
    ctx.textAlign = "left";
    ctx.fillStyle = "#000";
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

        if (options.drawRaiseHeightCandidate && c.isRaiseHeightCandidate) {
            ctx.fillStyle = "rgba(0,0,255,0.2)";
            ctx.fillRect(x*size,y*size,size,size);
        }

        if (options.drawShrinkWidthCandidate && c.isShrinkWidthCandidate) {
            ctx.fillStyle = "rgba(255,0,0,0.2)";
            ctx.fillRect(x*size,y*size,size,size);
        }

        if (options.drawJoinCandidate && c.isJoinCandidate) {
            ctx.fillStyle = "rgba(0,255,0,0.2)";
            ctx.fillRect(x*size,y*size,size,size);
        }

        if (options.drawSingleDeadEnd && c.isSingleDeadEndCandidate) {
            ctx.fillStyle = "rgba(255,255,0,0.4)";
            ctx.fillRect(x*size,y*size,size,size);
        }

        if (options.drawDoubleDeadEnd && c.isDoubleDeadEndCandidate) {
            ctx.fillStyle = "rgba(0,255,255,0.2)";
            ctx.fillRect(x*size,y*size,size,size);
        }

        if (options.drawVoidTunnel && c.isVoidTunnelCandidate) {
            ctx.fillStyle = "rgba(0,0,0,0.2)";
            ctx.fillRect(x*size,y*size,size,size);
        }

        if (options.drawChosenTunnel && c.topTunnel) {
            ctx.beginPath();
            ctx.save();
            ctx.translate(x*size+size/2,y*size+5);
            ctx.moveTo(-arrowsize,arrowsize);
            ctx.lineTo(0,0);
            ctx.lineTo(arrowsize,arrowsize);
            ctx.strokeStyle = "rgba(0,255,0,0.7)";
            ctx.stroke();
            ctx.restore();
        }
        else if (options.drawEdgeTunnel && c.isEdgeTunnelCandidate) {
            ctx.beginPath();
            ctx.save();
            ctx.translate(x*size+size/2,y*size+5);
            ctx.moveTo(-arrowsize,arrowsize);
            ctx.lineTo(0,0);
            ctx.lineTo(arrowsize,arrowsize);
            ctx.strokeStyle = "rgba(0,0,0,0.7)";
            ctx.stroke();
            ctx.restore();
        }

        if (options.drawRaiseHeight && c.raiseHeight) {
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

        if (options.drawShrinkWidth && c.shrinkWidth) {
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
        if (options.drawNumbers && c.no != undefined) {
            ctx.fillStyle = "#000";
            ctx.fillText(c.no, x*size+size/2, y*size+size/2);
        }
    }

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
    ctx.lineCap = 'round';
    ctx.strokeStyle = "rgba(0,0,0,0.9)";
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
        'o' : 'rgba(0,0,0,0.4)',
        ' ' : 'rgba(0,0,0,0.4)',
        '|' : 'rgba(0,0,0,0.1)',
        '-' : 'rgba(0,0,0,0.0)',
        '_' : 'rgba(0,0,0,0)',
    };
    var x,y;
    var color;
    for (i=0; i<subrows*fullcols; i++) {
        x = i % fullcols;
        y = Math.floor(i/fullcols);

        ctx.fillStyle = fillStyles[tiles[i]] || "#F00";
        ctx.fillRect(x*subsize,y*subsize,subsize,subsize);
    }

    ctx.restore();
};

var mapgen = function() {
    genRandom();
    var map = new Map(28,36,getTiles());
    map.name = "";
    map.wallFillColor = randomColor();
    map.wallStrokeColor = rgbString(hslToRgb(Math.random(), Math.random(), Math.random() * 0.4 + 0.6));
    map.pelletColor = "#ffb8ae";
    return map;
};
