
import sys

mapwidth = 5
mapheight = 9

######################################################################
# Define all possible pieces.

class Piece:
	def __init__(self):
		pass

	def setFromStr(self, s):
		offsets = []
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
							for p in offsets:
								p[1] -= y
							y = 0
							x += 1
							continue
					offsets.append([x,y])
				x += 1
			y += 1

		self.offsets = [(a[0],a[1]) for a in offsets]
		self.offsets.append((0,0))

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

######################################################################
# Determine valid pieces for each position regarding map boundaries.

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

######################################################################
# Create a tile map class for searching piece configurations.

class TileMap:
	def __init__(self):
		self.w = mapwidth
		self.h = mapheight
		self.reset()

	def getPieceList(self):
		return [valid_pieces[(x,y)][i].index for i,x,y in self.piece_stack]

	def getShell(self):
		s = ""
		for row in self.tiles:
			for c in row:
				if c == 0:
					s += "0"
				else:
					s += "1"
		return s

	def getState(self):
		return (self.getShell(), self.hasTopSquare, self.hasBottomSquare, self.numSize2, self.numSize5)

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
		self.maxSize2 = 2
		self.numSize5 = 0
		self.maxSize5 = 1

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
		if piece.size == 1:
			if y == 0 and self.hasTopSquare or self.hasBottomSquare:
				return False
		elif piece.size == 2:
			if self.numSize2 == self.maxSize2:
				return False
		elif piece.size == 5:
			if self.numSize5 == self.maxSize5:
				return False
		
		# prevent two horizontal pieces from being on top of one another
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
		if piece.size == 1:
			if y == 0:
				self.hasTopSquare = True
			else:
				self.hasBottomSquare = True
		elif piece.size == 2:
			self.numSize2 += 1
		elif piece.size == 5:
			self.numSize5 += 1
	
	def popPiece(self):
		i,x,y = self.piece_stack.pop()
		self.pos_dict[(x,y)] = None
		piece = valid_pieces[(x,y)][i]
		self.erasePiece(piece,x,y)
		if piece.size == 1:
			if y == 0:
				self.hasTopSquare = False
			else:
				self.hasBottomSquare = False
		elif piece.size == 2:
			self.numSize2 -= 1
		elif piece.size == 5:
			self.numSize5 -= 1
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

######################################################################
# Create preset piece configurations for segments of the map.

top_right_configs =    [p.index for p in pieces if p.size > 1 and (p.maxx,p.miny) in p.offsets]
bottom_right_configs = [p.index for p in pieces if p.size > 1 and (p.maxx,p.maxy) in p.offsets]

def createTopLeftConfigs():
	configs = []
	tile_map = TileMap()
	shouldStop = lambda x,y: y > 2
	def callback():
		configs.append(tile_map.getPieceList())
	tile_map.depthFirstSearch(0,0,solutionCallback=callback,shouldStop=shouldStop)
	return configs

def createBottomLeftConfigs():
	configs = []
	tile_map = TileMap()
	shouldStop = lambda x,y: x > 0
	def callback():
		configs.append(tile_map.getPieceList())
	tile_map.depthFirstSearch(0,5,solutionCallback=callback,shouldStop=shouldStop)
	return configs

top_left_configs = createTopLeftConfigs()
bottom_left_configs = createBottomLeftConfigs()

def printConfigInfo():
	print "TOP LEFT", len(top_left_configs)
	print "BOTTOM LEFT", len(bottom_left_configs)
	print "TOP RIGHT", len(top_right_configs)
	print "BOTTOM RIGHT", len(bottom_right_configs)

	def printConfig(label, configs):
		print label
		for config in configs:
			print config

	printConfig("TOP LEFT", top_left_configs)
	printConfig("BOTTOM LEFT", bottom_left_configs)
	printConfig("TOP RIGHT", top_right_configs)
	printConfig("BOTTOM RIGHT", bottom_right_configs)

######################################################################
# Main.

def main():
	printConfigInfo()

if __name__ == "__main__":
	main()
