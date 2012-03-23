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
path(X,Y) :- not wall(X,Y), xdim(X), ydim(Y).

% put walls around the map
wall(1,Y) :- ydim(Y).
wall(width,Y) :- ydim(Y).
wall(X,1) :- xdim(X).
wall(X,height) :- xdim(X).

% define ghost home
wall(homeleft..homeright,hometop..homebottom).
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

% prevent 3x3 wall
:- wall(X,Y), wall(X+1,Y), wall(X+2,Y), wall(X,Y+1), wall(X+1,Y+1), wall(X+2,Y+1), wall(X,Y+2), wall(X+1,Y+2), wall(X+2,Y+2), X<homeleft.
:- wall(X,Y), wall(X+1,Y), wall(X+2,Y), wall(X,Y+1), wall(X+1,Y+1), wall(X+2,Y+1), wall(X,Y+2), wall(X+1,Y+2), wall(X+2,Y+2), X>homeright.
:- wall(X,Y), wall(X+1,Y), wall(X+2,Y), wall(X,Y+1), wall(X+1,Y+1), wall(X+2,Y+1), wall(X,Y+2), wall(X+1,Y+2), wall(X+2,Y+2), Y<hometop.
:- wall(X,Y), wall(X+1,Y), wall(X+2,Y), wall(X,Y+1), wall(X+1,Y+1), wall(X+2,Y+1), wall(X,Y+2), wall(X+1,Y+2), wall(X+2,Y+2), Y>homebottom.

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
