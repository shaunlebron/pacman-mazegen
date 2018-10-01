const UP = 0;
const RIGHT = 1;
const DOWN = 2;
const LEFT = 3;

const numRows = 9;
const numCols = 5;

const ghostRow = 3;

function makeCell({ x, y }) {
  return {
    x,
    y,
    filled: false,
    connect: [false, false, false, false],
    next: {},
    no: undefined,
    group: undefined
  };
}

function setGhostHomeCells(table) {
  let c;
  c = table[ghostRow][0];
  c.filled = true;
  c.connect[LEFT] = c.connect[RIGHT] = c.connect[DOWN] = true;

  c = table[ghostRow][1];
  c.filled = true;
  c.connect[LEFT] = c.connect[DOWN] = true;

  c = table[ghostRow + 1][0];
  c.filled = true;
  c.connect[LEFT] = c.connect[UP] = c.connect[RIGHT] = true;

  c = table[ghostRow + 1][1];
  c.filled = true;
  c.connect[UP] = c.connect[LEFT] = true;
}

function makeCells() {
  // initialize cells
  const table = [];
  const cells = [];
  for (let y = 0; y < numRows; y++) {
    const row = [];
    for (let x = 0; x < numCols; x++) {
      const cell = makeCell({ x, y });
      cells.push(cell);
      row.push(cell);
    }
    table.push(row);
  }

  // allow each cell to refer to surround cells by direction
  for (const cell of cells) {
    const { x, y } = cell;
    if (x > 0) cell.next[LEFT] = table[y][x - 1];
    if (x < numCols - 1) cell.next[RIGHT] = table[y][x + 1];
    if (y > 0) cell.next[UP] = table[y - 1][x];
    if (y < numRows - 1) cell.next[DOWN] = table[y + 1][x];
  }

  setGhostHomeCells(table);

  return { table, cells };
}

function getLeftMostEmptyCells(table) {
  const leftCells = [];
  for (let x = 0; x < numCols; x++) {
    for (let y = 0; y < numRows; y++) {
      const c = table[y][x];
      if (!c.filled) leftCells.push(c);
    }
    if (leftCells.length > 0) break;
  }
  return leftCells;
}

function makeState() {
  return {
    cell: null,
    firstCell: null,
    firstCell: null,

    numFilled: 0,
    numGroups: 0,

    singleCount: {
      0: 0,
      [numRows - 1]: 0
    }
  };
}

function fillCell(state, cell) {
  cell.filled = true;
  cell.no = state.numFilled++;
  cell.group = state.numGroups;
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomElement(list) {
  const n = list.length;
  if (n > 0) return list[getRandomInt(0, n - 1)];
}

const probTopAndBotSingleCellJoin = 0.35;

function trySingleCellGroup(state) {
  const { cell, singleCount } = state;
  // randomly allow one single-cell piece on the top or bottom of the map.
  if (
    cell.x < numCols - 1 &&
    cell.y in singleCount &&
    Math.random() <= probTopAndBotSingleCellJoin &&
    singleCount[cell.y] == 0
  ) {
    cell.connect[cell.y == 0 ? UP : DOWN] = true;
    singleCount[cell.y]++;
    console.log("single cell group");
    return true;
  } else {
    console.log("NOT single cell group");
  }
}

function genRandomCells() {
  const { table } = makeCells();
  const state = makeState();

  while (true) {
    const openCells = getLeftMostEmptyCells(table);
    if (openCells.length === 0) break;

    // choose the center cell to be a random open cell, and fill it.
    state.firstCell = state.cell = randomElement(openCells);
    fillCell(state, state.cell);

    if (trySingleCellGroup(state)) continue;

    break;

    state.numGroups++;
  }
}

genRandomCells();
