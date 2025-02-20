
type Direction = "up" | "down" | "left" | "right";
type Pos = [number, number];
type Cell = "wall" | "empty";
type Maze = {
    start: Pos,
    end: Pos,
    width: number,
    height: number,
    cells: Cell[][]
};
// invariant:
//   start != end
//   width and height > 0
//   cells size correspond to width and height

type Action = { move: Direction } | { lookup: Pos };
type MazeSolver = (m: Maze) => Action[];
type MazeGenerator = (w: number, h: number) => Maze;

function pos_eq(p: Pos, q: Pos): boolean;
function get_cell(p: Pos, m: Maze): Cell;
function is_wall(c: Cell): boolean;

function move_action(d: Direction): Action;
function lookup_action(p: Pos): Action;

function set_cell(val: Cell, p: Pos, m: Maze): void;
function set_maze(val: Maze): void;
function draw_cell(val: Cell, p: Pos): void;
function draw_maze(m: Maze): void;
