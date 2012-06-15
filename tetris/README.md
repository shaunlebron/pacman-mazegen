
# Generate Pac-Man Mazes using Tetris-stacking

In the pursuit of a simple maze generator for Pac-Man, we first visualize the
structure of the original Pac-Man maps as a tiling of blocks.  Then, we attempt
to simplify this structure by lowering its resolution while still maintaining features.

The maps are symmetric, so only the middle to the right half are shown.

<img src="https://github.com/shaunew/Pac-Man/raw/gh-pages/mapgen/tetris/simplify.png" />

We propose that one may generate a random simplified map (phase 1), then transform
it to a correctly sized map by upscaling and applying some clever
shifting/resizing of a few key wall segments (phase 2).

## Contents

* index.htm currently displays a demo of random simple maps using phase1.js.
* drawpresets.htm draws the simplified versions of the original maps.
* main.py is an initial attempt that doesn't try simplifying first (on hold).
