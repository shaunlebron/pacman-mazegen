
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

<a href="http://shaunew.github.com/Pac-Man/mapgen">Click here to read the article explaining the current solution</a>

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
