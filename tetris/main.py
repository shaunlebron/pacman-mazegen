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

cols = 28
rows = 15
heights = [-1]*cols
tiles = ['_']*rows*cols

def get_tile(x,y):
    return tiles[x+y*cols]

def set_tile(x,y,key):
    tiles[x+y*cols] = key

def insert_piece(x,y,w,h,key):
    for y0 in xrange(y,y+h):
        for x0 in xrange(x,x+w):
            set_tile(x0,y0,key)
            heights[x0] = max(heights[x0],y0)

def print_tiles():
    for y in xrange(rows):
        for x in xrange(cols):
            sys.stdout.write(get_tile(x,y))
        print ""

def get_next_positions():
    bottom = min(heights)
    pos_list = []
    for x in xrange(cols-2):
        if heights[x] == bottom and heights[x+1] == bottom and heights[x+2] == bottom:
            if x == 0 or x == rows-3 or heights[x+3] != bottom or heights[x-1] != bottom:
                pos_list.append(x)
    return pos_list

if __name__ == "__main__":

    # insert ghost house
    insert_piece(10,0,6,6,'A')

    # display map
    print_tiles()
