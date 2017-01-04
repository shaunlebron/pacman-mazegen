_This is research I did in the summer of 2012. It was part of a larger Pac-Man
remake project that was given a [DMCA notice](https://github.com/github/dmca/blob/master/2012/2012-09-25-namco.markdown),
so I separated the legal maze generator into this repo here._

Pac-Man Map Generator
=====================

Objective
---------

The objective of this experiment is to create a method for generating random
maps (mazes) that seem aesthetically and functionally similar to the original
maps found in Pac-Man and Ms. Pac-Man.  When completed, this algorithm will be
added to the accurate Pac-Man project to increase the playability of the arcade
classic.

Status
------

Tetris solution works best. <a href="http://shaunlebron.github.com/pacman-mazegen">Click here to read the explanation.</a>

History
-------

- The 'randomfill' folder contains a Python solution that uses a special
  heuristic for progressively placing random valid walls.
- The 'answerset' folder contains a
  [Clingo](http://potassco.sourceforge.net/#clingo) solution that specifies
  declarative constraints.  This [blog post](http://eis-blog.ucsc.edu/2011/10/map-generation-speedrun/)
  is a good introduction to map generation using Clingo.
- The 'spanningtree' folder is a lead to apply a modified version of conventional maze generation algorithms.
- The 'tetris' folder contains a solution for stacking pieces in a tetris like manner.
