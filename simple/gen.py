
import sys

class Piece:
	def __init__(self):
		pass

	def setFromStr(self, s):
		self.offsets = []
		self.leftHeight = 0

		y = 0
		foundTop = False
		for line in s.split('\n'):
			x = 0
			for char in line.rstrip():
				if char == '#':
					if x == 0:
						self.leftHeight += 1
						if not foundTop:
							foundTop = True
							for p in self.offsets:
								p[1] -= y
							y = 0
							x += 1
							continue
					self.offsets.append([x,y])
				x += 1
			y += 1

def makePieces(a):
	pieces = []
	groups = a.split('\n\n')
	for group in groups:
		if not group.strip():
			continue
		piece = Piece()
		piece.setFromStr(group)
		pieces.append(piece)
	return pieces

pieces = makePieces("""

#   0

##  1

#   2
#

##  3
#

#   4
##

##  5
 #

 #  6
##

### 7
 #

 #  8
###

#   9
##
#

 #   10
##
 #

###  11
#

#    12
###

###  13
  #

  #  14
###

##   15
 #
 #

##   16
#
#

 #   17
###
 #

""")

# A top config is a list of piece numbers, from top to bottom.
top_configs = [
	[3,6],
	[3,1],
	[4,1],
	[5,4],
	[5,2],
	[1,3],
	[1,4],
	[1,2],
	[2,6],
	[2,1],
	[0,3],
	[0,4],
	[0,6,1],
	[9],
]

# A bottom config is a list of piece numbers, from top to bottom.
bottom_configs = [
	[3,3],
	[3,4],
	[3,2],
	[4,3],
	[3,5,0],
	[3,6,1],
	[3,6,0],
	[3,1,0],
	[4,4],
	[4,5,0],
	[4,1,0],
	[4,2],
	[1,5,4],
	[1,5,2],
	[2,3],
	[2,4],
	[2,6,1],
	[2,6,0],
	[2,1,0],
]

class TileMap:
	def __init__(self):
		self.w = 5
		self.h = 9
		self.tiles = [[0 for i in xrange(self.w)] for j in xrange(self.h)]
		self.tiles[3][0] = 1
		self.tiles[3][1] = 1
		self.tiles[4][0] = 1
		self.tiles[4][1] = 1
		self.num_pieces = 1

	def setTopConfig(self,i):
		x,y = 0,0
		for p in top_configs[i]:
			self.insertPiece(p,x,y)
			y += pieces[p].leftHeight

	def setBottomConfig(self,i):
		x,y = 0,5
		for p in bottom_configs[i]:
			self.insertPiece(p,x,y)
			y += pieces[p].leftHeight
	
	def __str__(self):
		s = ""
		for row in self.tiles:
			for col in row:
				if col == 1:
					col = ' '
				elif col == 0:
					col = '.'
				s += ('%3s' % str(col))
			s += "\n"
		return s

	def canPieceFit(self,p,x,y):
		if self.tiles[y][x] > 0:
			return False
		for dx,dy in pieces[p].offsets:
			x0 = x + dx
			y0 = y + dy
			if x0 >= self.w or y0 >= self.h or self.tiles[y0][x0] > 0:
				return False
		return True
	
	def insertPiece(self,p,x,y):
		self.num_pieces += 1
		n = self.num_pieces
		self.tiles[y][x] = n
		for dx,dy in pieces[p].offsets:
			self.tiles[y+dy][x+dx] = n

# create a stack of added pieces and their locations for back-tracking

# define limits
#	number of different pieces
#		one-cell pieces: 0-1
#	placement of certain pieces
#		one-cell piece: top or bottom row

def main():
	tile_map = TileMap()
	tile_map.setTopConfig(0)
	tile_map.setBottomConfig(0)
	print(tile_map)
	

if __name__ == "__main__":
	main()
