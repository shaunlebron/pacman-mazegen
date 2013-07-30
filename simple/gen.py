
import sys

mapwidth = 5
mapheight = 9

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

		self.offsets.append([0,0])
		self.miny = min(y for x,y in self.offsets)
		self.maxy = max(y for x,y in self.offsets)
		self.maxx = max(x for x,y in self.offsets)
		self.size = len(self.offsets)

def makePieces(a):
	pieces = []
	groups = a.split('\n\n')
	i = 0
	for group in groups:
		if not group.strip():
			continue
		piece = Piece()
		piece.index = i
		piece.setFromStr(group)
		pieces.append(piece)
		i += 1
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

def makeValidPieceTable(pieces):
	valid_pieces = {}
	for x in xrange(mapwidth-1):
		for y in xrange(mapheight):
			valid_pieces[(x,y)] = []

	def inPen(x,y):
		return x >= 0 and x <= 1 and y >= 3 and y <= 4

	for x,y in valid_pieces:

		# disallow anything in ghost pen
		if inPen(x,y):
			continue

		for p in pieces:

			# disallow anything in ghost pen
			if any(inPen(x+dx,y+dy) for dx,dy in p.offsets):
				continue

			# disallow piece of size 1 anywhere but the top and bottom rows
			if p.size == 1 and y > 0 and y < 8:
				continue

			# special restrictions on first column due to symmetry
			if x == 0:
				# disallow anything too wide
				if p.maxx > 1:
					continue

				# disallow anything too large
				if p.size > 4:
					continue

				# disallow complicated reflections
				if p.size == 4 and p.leftHeight == 1:
					continue

				# disallow pieces obstructing pacman's starting point
				if y == 5 and p.leftHeight > 2:
					continue
				if y == 6 and p.leftHeight > 1:
					continue

			# disallow pieces that don't fit inside map
			maxx = x + p.maxx
			miny = y + p.miny
			maxy = y + p.maxy
			if maxx >= mapwidth or miny < 0 or maxy >= mapheight:
				continue

			valid_pieces[(x,y)].append(p)

	return valid_pieces

valid_pieces = makeValidPieceTable(pieces)

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
		self.w = mapwidth
		self.h = mapheight
		self.reset()

	def reset(self):
		self.tiles = [[0 for i in xrange(self.w)] for j in xrange(self.h)]
		self.setTile(0,3,1)
		self.setTile(1,3,1)
		self.setTile(0,4,1)
		self.setTile(1,4,1)
		self.num_pieces = 1

		self.piece_stack = []
		self.pos_dict = dict(((x,y),None) for x in range(self.w-1) for y in range(self.h))

		# state
		self.hasTopSquare = False
		self.hasBottomSquare = False
		self.numSize2 = 0
		self.numSize5 = 0

	def setTopConfig(self,i):
		x,y = 0,0
		for p in top_configs[i]:
			piece = pieces[p]
			self.writePiece(piece,x,y)
			y += piece.leftHeight

	def setBottomConfig(self,i):
		x,y = 0,5
		for p in bottom_configs[i]:
			piece = pieces[p]
			self.writePiece(piece,x,y)
			y += piece.leftHeight

	def setTile(self,x,y,c):
		self.tiles[y][x] = c
	
	def getTile(self,x,y):
		return self.tiles[y][x]
	
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

	def canPieceFit(self,piece,x,y):
		if (piece.index == 1 and
			(x,y-1) in self.pos_dict and
			self.pos_dict[(x,y-1)] == 1):
			return False
		for dx,dy in piece.offsets:
			if self.getTile(x+dx,y+dy) > 0:
				return False
		return True

	def writePiece(self,piece,x,y):
		self.num_pieces += 1
		n = self.num_pieces
		for dx,dy in piece.offsets:
			self.setTile(x+dx,y+dy,n)

	def erasePiece(self,piece,x,y):
		self.num_pieces -= 1
		n = 0
		for dx,dy in piece.offsets:
			self.setTile(x+dx,y+dy,n)
	
	def pushPiece(self,i,x,y):
		piece = valid_pieces[(x,y)][i]
		self.pos_dict[(x,y)] = piece.index
		self.piece_stack.append((i,x,y))
		self.writePiece(piece,x,y)
	
	def popPiece(self):
		i,x,y = self.piece_stack.pop()
		self.pos_dict[(x,y)] = None
		piece = valid_pieces[(x,y)][i]
		self.erasePiece(piece,x,y)
		return i,x,y

	def getNextOpenTile(self,x,y):
		for x0 in xrange(x,self.w-1):
			for y0 in xrange(y,self.h):
				if self.getTile(x0,y0) == 0:
					return x0,y0
			y = 0
		return None

	def depthFirstSearch(self,x,y,solutionCallback=None,shouldStop=None,debug=False):
		i = 0
		while True:
			# We start this iteration knowing that we are at an open tile.

			# Try to find a piece that fits in our open tile.
			found_piece = False
			potential_pieces = valid_pieces[(x,y)][i:]
			for piece in potential_pieces:
				if self.canPieceFit(piece,x,y):
					if debug:
						print "can fit piece %d at (%d,%d)" % (piece.index,x,y)
						print self
					found_piece = True
					break
				i += 1


			# If we have found a piece to place at current tile.
			if found_piece:
				self.pushPiece(i,x,y)
				pos = self.getNextOpenTile(x,y)
				if not pos:
					if solutionCallback:
						solutionCallback()
					if debug:
						print "SOLUTION:"
						print self
				else: 
					i = 0
					x,y = pos

					if shouldStop and shouldStop(x,y):
						if solutionCallback:
							solutionCallback()

					# We have an open tile to continue with, so skip backtracking
					else:
						continue

			# Backtrack to find next open tile
			try:

				# Pop pieces until we get to a position whose possibilities haven't been exhausted.
				while True:
					i,x,y = self.popPiece()
					if debug:
						print "removed piece %d at (%d,%d)" % (valid_pieces[(x,y)][i].index, x,y)
						print self
					try:
						i += 1
						valid_pieces[(x,y)][i]
						# position not exhausted, use it.
						break
					except IndexError:
						# position exhausted, continue popping
						continue

			except IndexError:
				# exit search
				break

# create a stack of added pieces and their locations for back-tracking

# define limits
#	number of different pieces
#		one-cell pieces: 0-1
#	placement of certain pieces
#		one-cell piece: top or bottom row

def main():
	tile_map = TileMap()

	"""
	print "TOPS"
	tops = []
	shouldStop = lambda x,y: y > 2
	def solutionCallback():
		tops.append(str(tile_map))
		print tile_map
	tile_map.depthFirstSearch(0,0,solutionCallback=solutionCallback,shouldStop=shouldStop)
	print len(tops)

	print "BOTTOMS"
	bottoms = []
	shouldStop = lambda x,y: x > 0
	def solutionCallback():
		bottoms.append(str(tile_map))
		print tile_map
	tile_map.depthFirstSearch(0,5,solutionCallback=solutionCallback,shouldStop=shouldStop)
	print len(bottoms)
	"""

	starts = []
	shouldStop = lambda x,y: x > 1
	def solutionCallback():
		starts.append(str(tile_map))
		#print tile_map
	tile_map.depthFirstSearch(0,0,solutionCallback=solutionCallback,shouldStop=shouldStop)
	print len(starts)

if __name__ == "__main__":
	main()
