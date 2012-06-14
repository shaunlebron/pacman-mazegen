
var mapgen = (function(){

    var rows = 28;
    var cols = 15;
    var i;

    var tiles = [];
    var badEndTiles = [];
    var tops = [];

    var isTile = function(x,y) {
        return !(x<0 || x>=cols || y<0 || y>=rows);
    };

    var getTile = function(x,y) {
        return isTile(x,y) ? tiles[x+y*cols] : '_';
    };

    var setTile = function(x,y,key) {
        if (isTile(x,y))
            tiles[x+y*cols] = key;
        else
            throw "("+x+","+y+") not a valid tile index";
    };

    var insertTileBlock = function(x,y,w,h,key) {
        var x0,y0;
        for (x0=0; x0<w; x0++) {
            for (y0=0; y0<h; y0++) {
                setTile(x+x0,y+y0,key);
                tops[x+x0] = Math.max(tops[x+x0], y+y0+1);
            }
        }
        // TODO: add bad-end tiles
    };

    var resetTiles = function() {
        for (i=0; i<cols; i++) {
            tops[i] = 0;
            badEndTiles[i] = [];
        }
        for (i=0; i<rows*cols; i++) {
            tiles[i] = '_';
        }
    };

    var toMap = function() {

        // loop controls
        var i,j;

        // start with first common tiles
        var t = (
            "____________________________" +
            "____________________________" +
            "____________________________");

        // first row
        for (i=0; i<cols-2; i++)
            t += getTile(cols-3-i,0) == '_' ? '_' : '|';
        for (i=0; i<cols-2; i++)
            t += getTile(2+i,0) == '_' ? '_' : '|';

        for (i=0; i<rows-2; i++) {
            j = rows-3-i;

            t += "|";

            t += "|";
        }

        // append last common tiles
        t += (
            "||||||||||||||||||||||||||||" +
            "____________________________" +
            "____________________________" );

        return Map(28,36,t);
    };

    return function() {
        resetTiles();
        // TODO: fill map with random blocks
        return toMap();
    };
})();
