#const width=28.
#const height=31.
#const homeleft=11.
#const homeright=18.
#const hometop=13.
#const homebottom=17.
#const pacy=24.
#const pacx1=13.
#const pacx2=16.

xdim(1..width).
ydim(1..height).

% choose arbitrary walls
{ wall(X,Y) :xdim(X) :ydim(Y) }.

% define paths as tiles that are not walls
path(X,Y) :- not wall(X,Y), not home(X,Y), xdim(X), ydim(Y).

% put walls around the map
wall(1,Y;;width,Y) :- ydim(Y).
wall(X,1;;X,height) :- xdim(X).

% define ghost home
wall(homeleft..homeright,hometop).
wall(homeleft..homeright,homebottom).
wall(homeleft,hometop..homebottom).
wall(homeright,hometop..homebottom).
home(homeleft+1..homeright-1,hometop+1..homebottom-1).
path(homeleft-1,hometop-1..homebottom+1).
path(homeright+1,hometop-1..homebottom+1).
path(homeleft-1..homeright+1,hometop-1).
path(homeleft-1..homeright+1,homebottom+1).

% define pacman start
path(pacx1..pacx2,pacy).

% ensure all paths are reachable
step(1,0;;0,1;;-1,0;;0,-1).
reachable(pacx1,pacy).
reachable(X,Y) :- path(X,Y), reachable(X+DX,Y+DY), step(DX,DY).
:- path(X,Y), not reachable(X,Y).

% prevent fat paths:
:- path(X,Y), path(X,Y+1), path(X+1,Y), path(X+1,Y+1).

% prevent this
% |.
% .|
% and
% .|
% |.
:- wall(X,Y), wall(X+1,Y+1), path(X+1,Y), path(X,Y+1).
:- path(X,Y), path(X+1,Y+1), wall(X+1,Y), wall(X,Y+1).

% prevent thin walls
:- wall(X,Y), path(X+1,Y), path(X-1,Y).
:- wall(X,Y), path(X,Y+1), path(X,Y-1).

% prevent this
%  |.
% .|
:- wall(X,Y), wall(X,Y+1), path(X+1,Y), path(X-1,Y+1).
:- wall(X,Y), wall(X,Y+1), path(X-1,Y), path(X+1,Y+1).
% .
% ||
%  .
:- wall(X,Y), wall(X+1,Y), path(X,Y-1), path(X+1,Y+1).
:- wall(X,Y), wall(X+1,Y), path(X+1,Y-1), path(X,Y+1).

% prevent 2x2 wall island
:- path(X,Y), path(X+1,Y), path(X+2,Y), path(X+3,Y),
  path(X,Y+1), path(X+3,Y+1),
  path(X,Y+2), path(X+3,Y+2),
  path(X,Y+3), path(X+1,Y+3), path(X+2,Y+3), path(X+3,Y+3).

% TODO: limit number of contiguous pieces (~20)
% TODO: limit size of a contiguous piece

% prevent 3x3 wall
% TODO: prevent 3x3 walls unless they are in a rectangle block
%:- wall(X,Y), wall(X+1,Y), wall(X+2,Y), 
%   wall(X,Y+1), wall(X+1,Y+1), wall(X+2,Y+1),
%   wall(X,Y+2), wall(X+1,Y+2), wall(X+2,Y+2).

% prevent this:
% .|| ||.
% ||| |||
% ||. .||
:- path(X,Y), wall(X+1,Y), wall(X+2,Y), wall(X,Y+1), wall(X+1,Y+1), wall(X+2,Y+1), wall(X,Y+2), wall(X+1,Y+2), path(X+2,Y+2).
:- wall(X,Y), wall(X+1,Y), path(X+2,Y), wall(X,Y+1), wall(X+1,Y+1), wall(X+2,Y+1), path(X,Y+2), wall(X+1,Y+2), wall(X+2,Y+2).

% prevent dead ends
:- path(X,Y), path(X,Y+1), wall(X-1,Y), wall(X+1,Y), wall(X,Y-1).
:- path(X,Y), path(X,Y-1), wall(X-1,Y), wall(X+1,Y), wall(X,Y+1).
:- path(X,Y), path(X-1,Y), wall(X,Y+1), wall(X,Y-1), wall(X+1,Y).
:- path(X,Y), path(X+1,Y), wall(X,Y+1), wall(X,Y-1), wall(X-1,Y).
:- path(X,Y), wall(X+1,Y), wall(X,Y+1), wall(X,Y-1), wall(X-1,Y).

% prevent tight corners
:- path(X,Y), path(X+1,Y), path(X+1,Y+1), path(X+2,Y+1).
:- path(X,Y), path(X-1,Y), path(X-1,Y+1), path(X-2,Y+1).
:- path(X,Y), path(X,Y+1), path(X+1,Y+1), path(X+1,Y+2).
:- path(X,Y), path(X,Y+1), path(X-1,Y+1), path(X-1,Y+2).

% prevent horizontal asymmetry
:- wall(X,Y), path(width-X+1,Y).

% prevent thick outer wall
:- wall(2,Y), path(3,Y), ydim(Y).
:- wall(width-1,Y), path(width-2,Y), ydim(Y).
:- wall(X,2), path(X,3), xdim(X).
:- wall(X,height-1), path(X,height-2), xdim(X).

% make sure there are less than 520 wall tiles
% (maps should have around 310 walkable tiles)
:- 520 { wall(X,Y) }.
