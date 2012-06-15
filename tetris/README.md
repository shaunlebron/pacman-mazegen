
# Generate Pac-Man Mazes using Tetris-stacking

In the pursuit of a simple maze generator for Pac-Man, we first visualize the
structure of the original Pac-Man maps as a tiling of blocks.  Then, we attempt
to simplify this structure by lowering its resolution while still maintaining features.

** Original **

<img src="https://github.com/shaunew/Pac-Man/raw/gh-pages/mapgen/img/origmaps_path.png" width="100%"/>

** Simplified **

The maps are symmetric, so only the middle to the right half are shown.

<img src="https://github.com/shaunew/Pac-Man/raw/gh-pages/mapgen/tetris/presets.png" />

We can transform a simplified structure back to its original higher resolution
map by upscaling by a factor of 3, and doing some clever shifting and resizing
of a few key wall segments.

