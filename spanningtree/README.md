
Spanning Tree Method
--------------------

Conventional mazes can be created by generating a spanning tree of a
rectangular grid of nodes.  [Check out this great presentation by Jamis Buck to
learn about conventional maze generators](http://www.jamisbuck.org/presentations/rubyconf2011/index.html).

We can translate such spanning trees to be used in a Pac-Man tilemap by placing each node in the center of a 3x3 tile cell:

<img src="https://github.com/shaunew/Pac-Man/raw/gh-pages/mapgen/img/spanning1.png"/>
