
Pac-Man Map Generator
=====================

Objective
---------

The objective of this experiment is to create a method for generating random
maps (mazes) that seem aesthetically and functionally similar to the original
maps found in Pac-Man and Ms. Pac-Man.  When completed, this algorithm will be
added to the accurate Pac-Man project to increase the playability of the arcade
classic.

Works in Progress
-----------------

- The 'randomfill' folder contains a Python solution that uses a special
  heuristic for progressively placing random valid walls.
- The 'answerset' folder contains a
  [Clingo](http://potassco.sourceforge.net/#clingo) solution that specifies
  declarative constraints.  This [blog post](http://eis-blog.ucsc.edu/2011/10/map-generation-speedrun/)
  is a good introduction to map generation using Clingo.
- The 'spanningtree' folder is a lead to apply a modified version of conventional maze generation algorithms.
- The 'tetris' folder contains a solution for stacking pieces in a tetris like manner.

Original Maps
-------------

The following shows the structure of each of the six original maps.

**Color Version**

<img src="https://github.com/shaunew/Pac-Man/raw/gh-pages/mapgen/img/origmaps_2x.png" width="100%"/>

**Plain Version**

<img src="https://github.com/shaunew/Pac-Man/raw/gh-pages/mapgen/img/origmaps_2x_print.png" width="100%"/>

**Paths Version**

This is perhaps the simplest way to visualize the maps.

<img src="https://github.com/shaunew/Pac-Man/raw/gh-pages/mapgen/img/origmaps_2x_print.png" width="100%"/>

NOTE: The original prototype shown above is a [photograph of Iwatani's sketchbook](http://www.control-online.nl/gamesindustrie/2010/06/22/iwatani-toont-gamesgeschiedenis-in-meest-pure-vorm/).

Check the 'img' subfolder for details on how the pictures above were generated.
