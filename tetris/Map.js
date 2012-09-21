// direction enums (in clockwise order)
var DIR_UP = 0;
var DIR_RIGHT = 1;
var DIR_DOWN = 2;
var DIR_LEFT = 3;

// get direction enum from a direction vector
var getEnumFromDir = function(dir) {
    if (dir.x==-1) return DIR_LEFT;
    if (dir.x==1) return DIR_RIGHT;
    if (dir.y==-1) return DIR_UP;
    if (dir.y==1) return DIR_DOWN;
};

// set direction vector from a direction enum
var setDirFromEnum = function(dir,dirEnum) {
    if (dirEnum == DIR_UP)         { dir.x = 0; dir.y =-1; }
    else if (dirEnum == DIR_RIGHT)  { dir.x =1; dir.y = 0; }
    else if (dirEnum == DIR_DOWN)  { dir.x = 0; dir.y = 1; }
    else if (dirEnum == DIR_LEFT) { dir.x = -1; dir.y = 0; }
};

// size of a square tile in pixels
var tileSize = 8;

// constructor
var Map = function(numCols, numRows, tiles) {

    // sizes
    this.numCols = numCols;
    this.numRows = numRows;
    this.numTiles = numCols*numRows;
    this.widthPixels = numCols*tileSize;
    this.heightPixels = numRows*tileSize;

    // ascii map
    this.tiles = tiles;

    this.resetCurrent();
    this.parseWalls();
};

// reset current tiles
Map.prototype.resetCurrent = function() {
    this.currentTiles = this.tiles.split(""); // create a mutable list copy of an immutable string
};

// This is a procedural way to generate original-looking maps from a simple ascii tile
// map without a spritesheet.
Map.prototype.parseWalls = function() {

    var that = this;

    // creates a list of drawable canvas paths to render the map walls
    this.paths = [];

    // a map of wall tiles that already belong to a built path
    var visited = {};

    // we extend the x range to suggest the continuation of the tunnels
    var toIndex = function(x,y) {
        if (x>=-2 && x<that.numCols+2 && y>=0 && y<that.numRows)
            return (x+2)+y*(that.numCols+4);
    };

    // a map of which wall tiles that are not completely surrounded by other wall tiles
    var edges = {};
    var i=0,x,y;
    for (y=0;y<this.numRows;y++) {
        for (x=-2;x<this.numCols+2;x++,i++) {
            if (this.getTile(x,y) == '|' &&
                (this.getTile(x-1,y) != '|' ||
                this.getTile(x+1,y) != '|' ||
                this.getTile(x,y-1) != '|' ||
                this.getTile(x,y+1) != '|' ||
                this.getTile(x-1,y-1) != '|' ||
                this.getTile(x-1,y+1) != '|' ||
                this.getTile(x+1,y-1) != '|' ||
                this.getTile(x+1,y+1) != '|')) {
                edges[i] = true;
            }
        }
    }

    // walks along edge wall tiles starting at the given index to build a canvas path
    var makePath = function(tx,ty) {

        // get initial direction
        var dir = {};
        var dirEnum;
        if (toIndex(tx+1,ty) in edges)
            dirEnum = DIR_RIGHT;
        else if (toIndex(tx, ty+1) in edges)
            dirEnum = DIR_DOWN;
        else
            throw "tile shouldn't be 1x1 at "+tx+","+ty;
        setDirFromEnum(dir,dirEnum);

        // increment to next tile
        tx += dir.x;
        ty += dir.y;

        // backup initial location and direction
        var init_tx = tx;
        var init_ty = ty;
        var init_dirEnum = dirEnum;

        var path = [];
        var pad; // (persists for each call to getStartPoint)
        var point;
        var lastPoint;

        var turn,turnAround;

        /*

           We employ the 'right-hand rule' by keeping our right hand in contact
           with the wall to outline an individual wall piece.

           Since we parse the tiles in row major order, we will always start
           walking along the wall at the leftmost tile of its topmost row.  We
           then proceed walking to the right.  

           When facing the direction of the walk at each tile, the outline will
           hug the left side of the tile unless there is a walkable tile to the
           left.  In that case, there will be a padding distance applied.
           
        */
        var getStartPoint = function(tx,ty,dirEnum) {
            var dir = {};
            setDirFromEnum(dir, dirEnum);
            if (!(toIndex(tx+dir.y,ty-dir.x) in edges))
                pad = that.isFloorTile(tx+dir.y,ty-dir.x) ? 5 : 0;
            var px = -tileSize/2+pad;
            var py = tileSize/2;
            var a = dirEnum*Math.PI/2;
            var c = Math.cos(a);
            var s = Math.sin(a);
            return {
                // the first expression is the rotated point centered at origin
                // the second expression is to translate it to the tile
                x:(px*c - py*s) + (tx+0.5)*tileSize,
                y:(px*s + py*c) + (ty+0.5)*tileSize,
            };
        };
        while (true) {
            
            visited[toIndex(tx,ty)] = true;

            // determine start point
            point = getStartPoint(tx,ty,dirEnum);

            if (turn) {
                // if we're turning into this tile, create a control point for the curve
                //
                // >---+  <- control point
                //     |
                //     V
                lastPoint = path[path.length-1];
                if (dir.x == 0) {
                    point.cx = point.x;
                    point.cy = lastPoint.y;
                }
                else {
                    point.cx = lastPoint.x;
                    point.cy = point.y;
                }
            }

            // update direction
            turn = false;
            turnAround = false;
            if (toIndex(tx+dir.y, ty-dir.x) in edges) { // turn left
                dirEnum = (dirEnum+3)%4;
                turn = true;
            }
            else if (toIndex(tx+dir.x, ty+dir.y) in edges) { // continue straight
            }
            else if (toIndex(tx-dir.y, ty+dir.x) in edges) { // turn right
                dirEnum = (dirEnum+1)%4;
                turn = true;
            }
            else { // turn around
                dirEnum = (dirEnum+2)%4;
                turnAround = true;
            }
            setDirFromEnum(dir,dirEnum);

            // commit path point
            path.push(point);

            // special case for turning around (have to connect more dots manually)
            if (turnAround) {
                path.push(getStartPoint(tx-dir.x, ty-dir.y, (dirEnum+2)%4));
                path.push(getStartPoint(tx, ty, dirEnum));
            }

            // advance to the next wall
            tx += dir.x;
            ty += dir.y;

            // exit at full cycle
            if (tx==init_tx && ty==init_ty && dirEnum == init_dirEnum) {
                that.paths.push(path);
                break;
            }
        }
    };

    // iterate through all edges, making a new path after hitting an unvisited wall edge
    i=0;
    for (y=0;y<this.numRows;y++)
        for (x=-2;x<this.numCols+2;x++,i++)
            if (i in edges && !(i in visited)) {
                visited[i] = true;
                makePath(x,y);
            }
};

Map.prototype.posToIndex = function(x,y) {
    if (x>=0 && x<this.numCols && y>=0 && y<this.numRows) 
        return x+y*this.numCols;
};
// retrieves tile character at given coordinate
// extended to include offscreen tunnel space
Map.prototype.getTile = function(x,y) {
    if (x>=0 && x<this.numCols && y>=0 && y<this.numRows) 
        return this.currentTiles[this.posToIndex(x,y)];

    // extend walls and paths outward for entrances and exits
    if ((x==-1           && this.getTile(x+1,y)=='|' && (this.isFloorTile(x+1,y+1)||this.isFloorTile(x+1,y-1))) ||
        (x==this.numCols && this.getTile(x-1,y)=='|' && (this.isFloorTile(x-1,y+1)||this.isFloorTile(x-1,y-1))))
        return '|';
    if ((x==-1           && this.isFloorTile(x+1,y)) ||
        (x==this.numCols && this.isFloorTile(x-1,y)))
        return ' ';
};

// determines if the given character is a walkable floor tile
Map.prototype.isFloorTileChar = function(tile) {
    return tile==' ' || tile=='.' || tile=='o';
};

// determines if the given tile coordinate has a walkable floor tile
Map.prototype.isFloorTile = function(x,y) {
    return this.isFloorTileChar(this.getTile(x,y));
};

// function to draw the map as a tile map
Map.prototype.draw = function(ctx,left,top,print) {

    // save state
    ctx.save();
    ctx.translate(0.5,0.5); // pixel perfect lines?

    // translate to the position of the map
    ctx.translate(left,top);

    // clip the drawing surface
    ctx.beginPath();
    ctx.rect(0,0,this.widthPixels, this.heightPixels);
    ctx.clip();
    if (!print) {
        ctx.fillStyle = "#000";
        ctx.fillRect(0,0,this.widthPixels, this.heightPixels);
    }

    // set colors
    ctx.fillStyle = print?"#333":this.wallFillColor;
    ctx.strokeStyle = print?"#333":this.wallStrokeColor;

    var x,y;
    var i,j;
    var tile;

    for (i=0; i<this.paths.length; i++) {
        var path = this.paths[i];
        ctx.beginPath();
        ctx.moveTo(path[0].x, path[0].y);
        for (j=1; j<path.length; j++) {
            if (path[j].cx != undefined)
                ctx.quadraticCurveTo(path[j].cx, path[j].cy, path[j].x, path[j].y);
            else
                ctx.lineTo(path[j].x, path[j].y);
        }
        ctx.quadraticCurveTo(path[j-1].x, path[0].y, path[0].x, path[0].y);
        ctx.fill();
        ctx.stroke();
    }

    // draw pellets for each path tile
    var pelletSize = print?tileSize:2;
    var energizerSize = 3;
    for (y=0; y<this.numRows; y++) {
        for (x=0; x<this.numCols; x++) {
            var t = this.getTile(x,y);
            if (t=='o' || t=='.' || t==' ') {
                ctx.fillStyle=print?"#bbb":this.pelletColor;
                ctx.fillRect(
                    x*tileSize+tileSize/2-pelletSize/2,
                    y*tileSize+tileSize/2-pelletSize/2,
                    pelletSize,pelletSize);
            }
        }
    }

    // draw grid
    ctx.strokeStyle=print?"rgba(0,0,0,0.3)":"rgba(255,255,255,0.3)";
    ctx.beginPath();
    for (y=0; y<=this.numRows; y++) {
        ctx.moveTo(0,y*tileSize);
        ctx.lineTo(this.widthPixels,y*tileSize);
    }
    for (x=0; x<=this.numCols; x++) {
        ctx.moveTo(x*tileSize,0);
        ctx.lineTo(x*tileSize,this.heightPixels);
    }
    ctx.stroke();

    // draw title
    if (this.name) {
        ctx.textBaseline = "top";
        ctx.font = "20px sans-serif";
        ctx.fillStyle = print?"#000":"#fff";
        ctx.fillText(this.name, 0,tileSize/2);
    }

    ctx.restore();

};

// function to draw the map using simple representation of the paths as straight lines
Map.prototype.drawPath = function(ctx,left,top) {
    var print = true;

    // save state
    ctx.save();
    ctx.translate(0.5,0.5); // pixel perfect lines?

    // translate to the position of the map
    ctx.translate(left,top);

    // clip the drawing surface
    ctx.beginPath();
    ctx.rect(0,0,this.widthPixels, this.heightPixels);
    ctx.clip();

    var x,y;
    var i,j;
    var tile;

    // draw pellets for each path tile
    ctx.lineWidth = 2.0;
    ctx.strokeStyle="rgba(0,0,0,0.8)";
    ctx.beginPath();
    for (y=0; y<this.numRows-1; y++) {
        for (x=0; x<this.numCols-1; x++) {
            if (this.isFloorTile(x,y)) {
                if (this.isFloorTile(x+1,y)) {
                    ctx.moveTo(x*tileSize,y*tileSize);
                    ctx.lineTo((x+1)*tileSize,y*tileSize);
                }
                if (this.isFloorTile(x,y+1)) {
                    ctx.moveTo(x*tileSize,y*tileSize);
                    ctx.lineTo(x*tileSize,(y+1)*tileSize);
                }
            }
        }
    }
    ctx.stroke();

    // draw grid
    ctx.lineWidth = 1.0;
    ctx.strokeStyle=print?"rgba(0,0,0,0.3)":"rgba(255,255,255,0.3)";
    ctx.beginPath();
    for (y=0; y<this.numRows; y++) {
        ctx.moveTo(0,y*tileSize);
        ctx.lineTo(this.widthPixels-tileSize,y*tileSize);
    }
    for (x=0; x<this.numCols; x++) {
        ctx.moveTo(x*tileSize,0);
        ctx.lineTo(x*tileSize,this.heightPixels-tileSize);
    }
    ctx.stroke();

    // draw title
    if (this.name) {
        ctx.fillStyle = print?"#000":"#fff";
        ctx.font = "20px sans-serif";
        ctx.textBaseline = "top";
        ctx.fillText(this.name, 0,tileSize/2);
    }

    ctx.restore();

};
