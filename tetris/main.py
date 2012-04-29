import sys

# 28 wide
# 15 high

# ghost house at x=[10,15] y=[0,5]

# starting position at x=19 or x=22 preventing starting directions of right or left, respectively.

# piece types:
# - block
# - straight
# - bend
# - cross

class Map:
    def __init__(self):
        self.cols = 28
        self.rows = 15
        self.heights = [-1]*self.cols
        self.tiles = ['_']*self.rows*self.cols

        # insert ghost house
        self.insert_piece(10,0,6,6,'A')

    def get_tile(self,x,y):
        return self.tiles[x+y*self.cols]

    def set_tile(self,x,y,key):
        self.tiles[x+y*self.cols] = key

    def insert_piece(self,x,y,w,h,key):
        for y0 in xrange(y,y+h):
            for x0 in xrange(x,x+w):
                self.set_tile(x0,y0,key)
                self.heights[x0] = max(self.heights[x0],y0)

    def print_tiles(self):
        for y in xrange(self.rows):
            for x in xrange(self.cols):
                sys.stdout.write(self.get_tile(x,y))
            print ""

    def update_next_positions(self):
        self.bottom = min(self.heights)
        self.pos_list = []
        for x in xrange(self.cols-2):
            if self.heights[x] == self.bottom and self.heights[x+1] == self.bottom and self.heights[x+2] == self.bottom:
                if x == 0 or self.heights[x-1] != self.bottom:
                    self.pos_list.append(x)
                    # TODO: mark direction right
                elif x == self.cols-3 or self.heights[x+3] != self.bottom:
                    self.pos_list.append(x)
                    # TODO: mark direction left

if __name__ == "__main__":

    m = Map()

    # display map
    m.print_tiles()

    m.update_next_positions()
    print m.pos_list
