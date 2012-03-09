#!/usr/bin/python

"""
Running this script spits out a random Pac-Man maze

a current example:
||||||||||||||||||||||||||||
|..........................|
|.|||.||.||.||||.||.||.|||.|
|.|||.||.||.||||.||.||.|||.|
|........||.||||.||........|
|.||.|||.||.||||.||.|||.||.|
|.||.|||............|||.||.|
|.||.|||||.||..||.|||||.||.|
|......|||.||..||.|||......|
|.||||.|||.||..||.|||.||||.|
|.||||.|||.||..||.|||.||||.|
|..........................|
|.|||.|||.||||||||.|||.|||.|
|.|||.|||.||||||||.|||.|||.|
|.|||.....||||||||.....|||.|
|.....|||.||||||||.|||.....|
|.||.||||.||||||||.||||.||.|
|.||.|||............|||.||.|
|....|||.||.||||.||.|||....|
|.||.....||.||||.||.....||.|
|.||.|||.||......||.|||.||.|
|....|||.||.||||.||.|||....|
|.||.|||....||||....|||.||.|
|.||.|||.||......||.|||.||.|
|.....||.||.||||.||.||.....|
|.|||.||.||.||||.||.||.|||.|
|.|||..................|||.|
|.|||.|||.||.||.||.|||.|||.|
|.|||.|||.||.||.||.|||.|||.|
|..........................|
||||||||||||||||||||||||||||

OVERVIEW:

This currently works by starting with an empty half map with a ghost
house.

We add walls by placing 2x2 blocks in areas that allow for a one
tile wide margin.

....   ....
....   .||.
.... > .||.
....   ....

After placing a new wall piece, a gap-filling heuristic is used to grow the piece. 
Basically, the wall is grown to fill in adjacent areas that cannot be filled by new pieces.

...........   ...........   ...........
...||......   ...||......   ...||......
...||......   ...||......   ...||......
........... > ........||. > ......||||.
..||.......   ..||....||.   ..||.|||||.
..||.......   ..||.......   ..||.||....
...........   ...........   ...........

  (start)     (new piece)  (after growth)


CURRENT PROBLEMS:

Walls are very fragmented.  Make the pieces grow more by extending in a random direction after initial mandatory growing.

We could alternatively do a post-process to join smaller pieces together:
.......   .......
.||.||. > .|||||.
.||.||.   .|||||.
.......   .......

Some gaps aren't filled, need to study them some more and add appropriate test cases.

There is currently a path around the entire border. 
Could possibly extend some contiguous pieces to the border to fix this.

Seems rare, but sometimes dead ends and single tile thick walls are formed.
It could be easier to just throw out a map if this conditions are detected.

Conditions:
a 2x2 empty block => dead end
a wall tile that is not part of a 2x2 wall block => single tile wall

"""

import sys
import random

# TODO:
# define an Obstacle class to represent a single group of contiguous wall tiles 
# Obstacle class
# Box Obstacle
# Line Obstacle
# map from tile to Obstacle

# takes multi-line map string, trims indentation, replaces newlines with given separator
def format_map_str(tiles,sep):
    return sep.join(line.strip() for line in tiles.splitlines())

class Map:
    def __init__(self,w,h,tile_str=None):

        if tile_str is None:
            # just create a clear map
            self.tiles = []
            self.w = w
            self.h = h
            for i in xrange(w*h):
                self.tiles.append('.')
        else:
            self.setMap(w,h,tile_str)

        # sets logging verbosity (on|off)
        self.verbose = False

    # create a map from a tile string
    def setMap(self,w,h,tile_str):
        self.w = w
        self.h = h
        self.tiles = list(format_map_str(tile_str,""))

    # creates a string of the current map
    def __str__(self):
        s = "\n"
        i = 0
        for y in xrange(self.h):
            for x in xrange(self.w):
                s += self.tiles[i]
                i += 1
            s += "\n"
        return s

    # converts x,y to index
    def xy_to_i(self,x,y):
        return x+y*self.w

    # converts index to x,y
    def i_to_xy(self,i):
        return i%self.w, i/self.w

    # validates x,y
    def xy_valid(self,x,y):
        return x >= 0 and x < self.w and y>=0 and y<self.h

    # gets tile at x,y or returns None if invalid
    def get_tile(self,x,y):
        if not self.xy_valid(x,y):
            return None
        return self.tiles[x+y*self.w]

    # adds a single wall tile at x,y
    def add_wall_tile(self,x,y):
        if self.xy_valid(x,y):
            self.tiles[x+y*self.w] = '|'

    # adds a 2x2 block inside the 4x4 block at the given x,y coordinate 
    def add_wall_block(self,x,y):
        self.add_wall_tile(x+1,y+1)
        self.add_wall_tile(x+2,y+1)
        self.add_wall_tile(x+1,y+2)
        self.add_wall_tile(x+2,y+2)

    # determines if a 2x2 block can fit inside the 4x4 block at the given x,y coordinate
    # (the whole 4x4 block must be empty)
    def can_new_block_fit(self,x,y):
        if not (self.xy_valid(x,y) and self.xy_valid(x+3,y+3)):
            return False
        for y0 in xrange(y,y+4):
            for x0 in xrange(x,x+4):
                if self.get_tile(x0,y0) != '.':
                    return False
        return True

    # create a list of valid starting positions
    def update_pos_list(self):
        self.pos_list = []
        for y in xrange(self.h):
            for x in xrange(self.w):
                if self.can_new_block_fit(x,y):
                    self.pos_list.append((x,y))

    # A connection is a sort of dependency of one tile block on another.
    # If a valid starting position is against another wall, then add this tile
    # to other valid start positions' that intersect this one so that they fill
    # it when they are chosen.  This filling is a heuristic to eliminate gaps.
    def update_connections(self):
        self.connections = {}
        for y in xrange(self.h):
            for x in xrange(self.w):
                if (x,y) in self.pos_list:
                    if any(self.get_tile(x-1,y+y0)=='|' for y0 in range(4)): self.add_connection(x,y,1,0)
                    if any(self.get_tile(x+4,y+y0)=='|' for y0 in range(4)): self.add_connection(x,y,-1,0)
                    if any(self.get_tile(x+x0,y-1)=='|' for x0 in range(4)): self.add_connection(x,y,0,1)
                    if any(self.get_tile(x+x0,y+4)=='|' for x0 in range(4)): self.add_connection(x,y,0,-1)

    # the block at x,y is against a wall, so make intersecting blocks in the direction of 
    # dx,dy fill the block at x,y if they are filled first.
    def add_connection(self,x,y,dx,dy):
        def connect(x0,y0):
            src = (x,y)
            dest = (x0,y0)
            if not dest in self.pos_list:
                return
            if dest in self.connections:
                self.connections[dest].append(src)
            else:
                self.connections[dest] = [src]
        if (x,y) in self.pos_list:
            connect(x+dx,y+dy)
            connect(x+2*dx,y+2*dy)
            if not (x-dy,y-dx) in self.pos_list:
                connect(x+dx-dy,y+dy-dx)
            if not (x+dy,y+dx) in self.pos_list:
                connect(x+dx+dy,y+dy+dx)
            if not (x+dx-dy,y+dy-dx) in self.pos_list:
                connect(x+2*dx-dy, y+2*dy-dx)
            if not (x+dx+dy,y+dy+dx) in self.pos_list:
                connect(x+2*dx+dy, y+2*dy+dx)

    # update the starting positions and dependencies
    def update(self):
        self.update_pos_list()
        self.update_connections()

    # expand a wall block at the given x,y
    def expand_wall(self,x,y):
        visited = []
        def expand(x,y):
            src = (x,y)
            if src in visited:
                return
            visited.append(src)
            if src in self.connections:
                for x0,y0 in self.connections[src]:
                    self.add_wall_block(x0,y0)
                    expand(x0,y0)

        expand(x,y)
        return (x,y) in self.connections

    # start a wall at block x,y
    def add_wall_obstacle(self,x=None,y=None):
        self.update()
        if not self.pos_list:
            return False

        if (x is None or y is None):
            x,y = random.choice(self.pos_list)
        self.add_wall_block(x,y)
        map_before = str(self)

        if self.verbose:
            print "added block at ",x,y
        if self.expand_wall(x,y):
            if self.verbose:
                for line1,line2 in zip(map_before.splitlines(),str(self).splitlines()):
                    print line1, line2
        else:
            if self.verbose:
                print map_before

        dirEnum = random.choice(((0,-1),(0,1),(1,0),(-1,0)))

        return True

if __name__ == "__main__":

    # initial empty map with standard ghost house
    tileMap = Map(16,31,"""
        ||||||||||||||||
        |...............
        |...............
        |...............
        |...............
        |...............
        |...............
        |...............
        |...............
        |...............
        |...............
        |...............
        |.........||||||
        |.........||||||
        |.........||||||
        |.........||||||
        |.........||||||
        |...............
        |...............
        |...............
        |...............
        |...............
        |...............
        |...............
        |...............
        |...............
        |...............
        |...............
        |...............
        |...............
        ||||||||||||||||
        """)

    # verbosity option (-v)
    if len(sys.argv) > 1 and sys.argv[1] == "-v":
        tileMap.verbose = True

    # generate map by adding walls until there's no more room
    while tileMap.add_wall_obstacle():
        pass

    # reflect the first 14 columns to print the map
    for line in str(tileMap).splitlines():
        s = line[:-2]
        print s+s[::-1]
