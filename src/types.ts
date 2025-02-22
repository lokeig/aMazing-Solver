
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

type MoveAction = { type: "move", dir: Direction };
type LookupAction = { type: "lookup", pos: Pos };
type Action = MoveAction | LookupAction;
type Path = Action[];
type MazeSolver = (m: Maze) => Path;
type MazeGenerator = (w: number, h: number) => Maze;

function pos_eq(p: Pos, q: Pos): boolean;
function get_cell(p: Pos, m: Maze): Cell;
function is_wall(c: Cell): boolean;

function move_action(d: Direction): MoveAction;
function lookup_action(p: Pos): MoveAction;
function is_move_action(a: Action): a is MoveAction;
function is_lookup_action(a: Action): a is LookupAction;

function verify_path(p: Path, m: Maze): boolean;

function set_cell(val: Cell, p: Pos, m: Maze): void;
function draw_cell(val: Cell, p: Pos): void;
function draw_maze(m: Maze): void;
