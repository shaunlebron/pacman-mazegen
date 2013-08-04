
import sys
import random

mapwidth = 5
mapheight = 9

######################################################################
# Define all possible pieces.

class Piece:
	def __init__(self):
		pass

	def __str__(self):
		return self.string

	def setFromStr(self, s):
		self.string = s
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

###  18
 #
 #

 #   19
 #
###

#    20
###
#

  #  21
###
  #

#### 22
 #

#### 23
  #

 #   24
####

  #  25
####

#    26
##
#
#

#    27
#
##
#

 #   28
##
 #
 #

 #   29
 #
##
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

def shuffleValidPieces(v):
	for a in v.values():
		random.shuffle(a)

valid_pieces = makeValidPieceTable(pieces)

######################################################################
# Create a tile map class for searching piece configurations.

UP = 0
RIGHT = 1
DOWN = 2
LEFT = 3

class Cell:
	def __init__(self,tile_map,x,y):
		self.x = x
		self.y = y
		self.nextCells = [None] * 4
		def isConnected(d):
			dx = [0,1,0,-1][d]
			dy = [-1,0,1,0][d]

			# make sure connection is horizontally reflected at x==0
			if x == 0 and dx == -1:
				dx = 1

			val = tile_map.getTile(x,y)

			# empty tiles (always on the right side in a completed map) always open to the right
			#if val == 0 and x == mapwidth-1 and dx = 1:
			#	return True

			x0 = x+dx
			y0 = y+dy

			if x0 < 0 or x0 >= mapwidth or y0 < 0 or y0 >= mapheight:
				return False

			adjacentVal = tile_map.getTile(x0,y0)

			return val == adjacentVal

		self.connect = [isConnected(i) for i in xrange(4)]


class TileMap:
	def __init__(self):
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
		self.tiles = [[0 for i in xrange(mapwidth)] for j in xrange(mapheight)]
		self.setTile(0,3,1)
		self.setTile(1,3,1)
		self.setTile(0,4,1)
		self.setTile(1,4,1)
		self.num_pieces = 1

		self.piece_stack = []
		self.pos_dict = dict(((x,y),None) for x in range(mapwidth-1) for y in range(mapheight))

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
	
	def buildCells(self):
		# build table of cells
		self.cells = [[Cell(self,x,y) for x in xrange(mapwidth)] for y in xrange(mapheight)]

		# allow the referencing of adjacent cells
		for y in xrange(mapheight):
			for x in xrange(mapwidth):
				c = self.cells[y][x]

				if y+1 < mapheight:
					cd = self.cells[y+1][x]
					c.nextCells[DOWN] = cd
					cd.nextCells[UP] = c

				if x+1 < mapwidth:
					cr = self.cells[y][x+1]
					c.nextCells[RIGHT] = cr
					cr.nextCells[LEFT] = c

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
			if y == 0:
				if self.hasTopSquare:
					return False
			elif y == mapheight-1:
				if self.hasBottomSquare:
					return False
			else:
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

		# update constraints
		if piece.size == 1:
			if y == 0:
				self.hasTopSquare = True
			else:
				self.hasBottomSquare = True
		elif piece.size == 2:
			self.numSize2 += 1
		elif piece.size == 5:
			self.numSize5 += 1

	def erasePiece(self,piece,x,y):
		self.num_pieces -= 1
		n = 0
		for dx,dy in piece.offsets:
			self.setTile(x+dx,y+dy,n)

		# update constraints
		if piece.size == 1:
			if y == 0:
				self.hasTopSquare = False
			else:
				self.hasBottomSquare = False
		elif piece.size == 2:
			self.numSize2 -= 1
		elif piece.size == 5:
			self.numSize5 -= 1

	def pushPiece(self,i,x,y):
		if isinstance(i,Piece):
			piece = i
			i = 0
			for j in valid_pieces[(x,y)]:
				i += 1
				if j == piece:
					break
		else:
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
		for x0 in xrange(x,mapwidth-1):
			for y0 in xrange(y,mapheight):
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
					self.buildCells()
					self.setResizeCandidates()
					if self.chooseTallRows() and self.chooseNarrowCols():
						if solutionCallback:
							solutionCallback()
						if debug:
							print "SOLUTION:"
							print self
						if shouldStop and shouldStop(None,None):
							break # stop search
						else:
							# TODO: set x,y to position before the first offending row or col that prevented resize
							pass
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

	def setResizeCandidates(self):
		for y in xrange(mapheight):
			for x in xrange(mapwidth):
				c = self.cells[y][x]
				q = c.connect

				#         _
				# |_| or | |
				if not q[LEFT] and not q[RIGHT] and (not q[UP] or not q[DOWN]):
					c.isRaiseHeightCandidate = True

				#  __
				# |__|
				if x+1 < mapwidth:
					cr = c.nextCells[RIGHT]
					qr = cr.connect
					if (not q[LEFT]   and not q[UP]  and not q[DOWN]  and q[RIGHT] and
						not qr[RIGHT] and not qr[UP] and not qr[DOWN] and qr[LEFT]):
						c.isRaiseHeightCandidate = cr.isRaiseHeightCandidate = True

				# _      _
				# _| or |_
				if not q[UP] and not q[DOWN] and q[LEFT] != q[RIGHT]:
					c.isShrinkWidthCandidate = True

				# empty cell on right border
				if x == mapwidth-1 and self.getTile(x,y) == 0:
					c.isShrinkWidthCandidate = True

				# _
				#  |
				# _|
				if y+1 < mapheight:
					cd = c.nextCells[DOWN]
					qd = cd.connect
					if (q[LEFT]  and not q[UP]    and not q[RIGHT]  and q[DOWN] and
						qd[LEFT] and not qd[DOWN] and not qd[RIGHT] and qd[UP]):
						c.isShrinkWidthCandidate = cd.isShrinkWidthCandidate = True
	
	def chooseTallRows(self):
		return True
	
	def chooseNarrowCols(self):
		return True

######################################################################
# Create preset piece configurations for segments of the map.

top_right_configs =    [[p.index] for p in pieces if p.size > 1 and (p.maxx,p.miny) in p.offsets]
bottom_right_configs = [[p.index] for p in pieces if p.size > 1 and (p.maxx,p.maxy) in p.offsets]

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

def getTopRightXY(piece):
	x = mapwidth-1-piece.maxx
	y = -piece.miny
	return x,y

def getBottomRightXY(piece):
	x = mapwidth-1-piece.maxx
	y = mapheight-1-piece.maxy
	return x,y

def findTopConfigs():
	configs = []
	tile_map = TileMap()
	for i,tl in enumerate(top_left_configs):
		tile_map.reset()
		x,y = 0,0
		for p in tl:
			piece = pieces[p]
			tile_map.pushPiece(piece,x,y)
			x,y = tile_map.getNextOpenTile(x,y)
		for j,tr in enumerate(top_right_configs):
			piece = pieces[tr[0]]
			x,y = getTopRightXY(piece)
			if tile_map.canPieceFit(piece,x,y):
				configs.append((i,j))
	return configs
	

def findBottomConfigs():
	configs = []
	tile_map = TileMap()
	for i,bl in enumerate(bottom_left_configs):
		tile_map.reset()
		x,y = 0,5
		for p in bl:
			piece = pieces[p]
			tile_map.pushPiece(piece,x,y)
			x,y = tile_map.getNextOpenTile(x,y)
		for j,br in enumerate(bottom_right_configs):
			piece = pieces[br[0]]
			x,y = getBottomRightXY(piece)
			if tile_map.canPieceFit(piece,x,y):
				configs.append((i,j))
	return configs

top_configs = findTopConfigs()
bottom_configs = findBottomConfigs()

def getAllConfigs():
	configs = []
	for i,tc in enumerate(top_configs):
		tl_index,tr_index = tc
		tl_config = top_left_configs[tl_index]
		tr_config = top_right_configs[tr_index]
		for j,bc in enumerate(bottom_configs):
			bl_index,br_index = bc
			bl_config = bottom_left_configs[bl_index]
			br_config = bottom_right_configs[br_index]

			# Write the top left and bottom left configs
			x,y = 0,0
			tile_map = TileMap()
			valid = True
			for p in tl_config + bl_config:
				piece = pieces[p]
				if tile_map.canPieceFit(piece,x,y):
					tile_map.writePiece(piece,x,y)
				else:
					valid = False
					break
				x,y = tile_map.getNextOpenTile(x,y)

			if valid:
				# Write the top right config
				piece = pieces[tr_config[0]]
				x,y = getTopRightXY(piece)
				if tile_map.canPieceFit(piece,x,y):
					tile_map.writePiece(piece,x,y)
				else:
					valid = False

			if valid:
				# Write the bottom right config
				piece = pieces[br_config[0]]
				x,y = getBottomRightXY(piece)
				if tile_map.canPieceFit(piece,x,y):
					tile_map.writePiece(piece,x,y)
				else:
					valid = False
			
			if valid:
				configs.append((i,j))
				
	return configs

all_configs = getAllConfigs()

def makePresetTileMap(i):
	top_config, bottom_config = all_configs[i]

	# Get configs
	tl_index,tr_index = top_configs[top_config]
	bl_index,br_index = bottom_configs[bottom_config]
	tl_config = top_left_configs[tl_index]
	tr_config = top_right_configs[tr_index]
	bl_config = bottom_left_configs[bl_index]
	br_config = bottom_right_configs[br_index]

	#print "top indexes:",tl_index, tr_index
	#print "bottom indexes:",bl_index, br_index
	#print "topleft:",tl_config
	#print "bottomleft:",bl_config
	#print "topright:",tr_config
	#print "bottomright:",br_config

	# Make tile map
	tile_map = TileMap()
	tile_map.preset_segments = [tl_index, tr_index, bl_index, br_index]
	tile_map.preset_pieces = [
		pieces[tr_config[0]].index,
		pieces[br_config[0]].index,
	]

	# Write the top left and bottom left configs
	x,y = 0,0
	for p in tl_config+bl_config:
		piece = pieces[p]
		tile_map.preset_pieces.append(piece.index)
		tile_map.writePiece(piece,x,y)
		x,y = tile_map.getNextOpenTile(x,y)

	# Write the top right config
	piece = pieces[tr_config[0]]
	x,y = getTopRightXY(piece)
	tile_map.writePiece(piece,x,y)

	# Write the bottom right config
	piece = pieces[br_config[0]]
	x,y = getBottomRightXY(piece)
	tile_map.writePiece(piece,x,y)

	return tile_map

def genMapForAllRoots():
	numRoots = len(all_configs)

	shouldStop = lambda x,y: x is None and y is None
	for i in xrange(numRoots):
		shuffleValidPieces(valid_pieces)
		print >> sys.stderr, "%d / %d:" % (i+1,numRoots)
		tile_map = makePresetTileMap(i)
		success = [False]
		def callback():
			success[0] = True
		x,y = tile_map.getNextOpenTile(0,0)
		tile_map.depthFirstSearch(x,y,solutionCallback=callback,shouldStop=shouldStop)
		if success[0]:
			print tile_map.preset_segments, tile_map.preset_pieces


######################################################################
# Main.

def main():
	genMapForAllRoots()

if __name__ == "__main__":
	main()
