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

step(-1;1,0;;0,-1;1).
diag(-1;1,-1;1).
surround(DX,DY) :- step(DX,DY).
surround(DX,DY) :- diag(DX,DY).

% choose arbitrary walls
% make sure there are less than 520 wall tiles
% (maps should have around 310 walkable tiles)
{ wall(X,Y) :xdim(X) :ydim(Y) } 520.

% choose no more than 40 blanks
{ blank(X,Y) :xdim(X) :ydim(Y) } 40.

% prevent long walls
:- wall(X+DX,Y), DX:=1..8, Y>1, Y<height.
:- wall(X,Y+DY), DY:=1..8, X>1, X<width.

% prevent blanks from touching paths
:- blank(X,Y), path(X+DX,Y+DY), surround(DX,DY).

% prevent walls from touching more than one blank
:- wall(X,Y), 2 { blank(X+DX,Y+DY) :step(DX,DY) } 2.

% prevent padding blanks with more than one wall
:- blank(X,Y), wall(X+DX,Y+DY), wall(X+2*DX,Y+2*DY), step(DX,DY).

% prevent a blank block from being adjacent to the edge of the map
:- blank(X,Y), wall(X+DX,Y+DY), not xdim(X+2*DX), not ydim(Y+2*DY), step(DX,DY).
%:- blank(X,Y), wall(X+1,Y), not xdim(X+2).
%:- blank(X,Y), wall(X-1,Y), not xdim(X-2).
%:- blank(X,Y), wall(X,Y+1), not ydim(Y+2).
%:- blank(X,Y), wall(X,Y-1), not ydim(Y-2).

% define paths as tiles that are not walls or blanks
path(X,Y) :- not wall(X,Y), not blank(X,Y), xdim(X), ydim(Y).

% prevent paths on top and bottom
:- path(X,1), xdim(X).
:- path(X,height), xdim(X).

% create 0 to 2 tunnels
{ path(1,Y) :ydim(Y) } 2.
:- path(1,Y), path(1,Y-1).
:- path(1,Y), path(1,Y+1).

% define ghost home
wall(homeleft..homeright,hometop;homebottom).
wall(homeleft;homeright,hometop..homebottom).
blank(homeleft+1..homeright-1,hometop+1..homebottom-1).
path(homeleft-1;homeright+1,hometop-1..homebottom+1).
path(homeleft-1..homeright+1,hometop-1;homebottom+1).

% define pacman start
path(pacx1..pacx2,pacy).

% ensure all paths are reachable
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
:- wall(X,Y), 9 { wall(X+DX,Y+DY) :DX=0..2 :DY=0..2 } 9.

% prevent this:
% .|   |.
% ||| |||
%  |. .| 
:- path(X,Y), wall(X+1,Y), wall(X,Y+1), wall(X+1,Y+1), wall(X+2,Y+1), wall(X+1,Y+2), path(X+2,Y+2).
:- wall(X+1,Y), path(X+2,Y), wall(X,Y+1), wall(X+1,Y+1), wall(X+2,Y+1), path(X,Y+2), wall(X+1,Y+2).

% prevent dead-ends
:- path(X,Y), 3 { wall(X+DX,Y+DY) :step(DX,DY) } 4.

% prevent tight corners
:- path(X,Y), path(X+1,Y), path(X+1,Y+1), path(X+2,Y+1).
:- path(X,Y), path(X-1,Y), path(X-1,Y+1), path(X-2,Y+1).
:- path(X,Y), path(X,Y+1), path(X+1,Y+1), path(X+1,Y+2).
:- path(X,Y), path(X,Y+1), path(X-1,Y+1), path(X-1,Y+2).

% prevent horizontal asymmetry
:- wall(X,Y), not wall(width-X+1,Y).
:- blank(X,Y), not blank(width-X+1,Y).

% prevent thick outer wall
:- wall(2,Y), path(3,Y), ydim(Y).
:- wall(width-1,Y), path(width-2,Y), ydim(Y).
:- wall(X,2), path(X,3), xdim(X).
:- wall(X,height-1), path(X,height-2), xdim(X).

