
export type Direction = "up" | "down" | "left" | "right";
export type Pos = { x: number, y: number };
export type Cell = "wall" | "empty";
export type Maze = {
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

export type MoveAction = { type: "move", dir: Direction };
export type LookupAction = { type: "lookup", pos: Pos };
export type Action = MoveAction | LookupAction;
export type Path = Action[];
export type MazeSolver = (m: Maze) => Path;
export type MazeGenerator = (w: number, h: number) => Maze;

export const WALL_CELL: Cell = "wall";
export const EMPTY_CELL: Cell = "empty";

export function make_pos(x: number, y: number): Pos {
    return { x, y };
}
export function pos_eq(p: Pos, q: Pos): boolean {
    return p.x === q.x && p.y === q.y;
}
export function get_cell(p: Pos, m: Maze): Cell {
    return m.cells[p.y][p.x];
}
export function set_cell(val: Cell, p: Pos, m: Maze): void {
    m.cells[p.y][p.x] = val;
}

export function is_wall(c: Cell): boolean {
    return c === "wall";
}

export function step_in_dir(p: Pos, d: Direction): Pos {
    switch (d) {
        case "up":
            return make_pos(p.x, p.y - 1);
        case "down":
            return make_pos(p.x, p.y + 1);
        case "left":
            return make_pos(p.x - 1, p.y);
        case "right":
            return make_pos(p.x + 1, p.y);
    }
}

export function move_action(d: Direction): MoveAction {
    return { type: "move", dir: d };
}
export function lookup_action(p: Pos): LookupAction {
    return { type: "lookup", pos: p };
}
export function is_move_action(a: Action): a is MoveAction {
    return a.type === "move";
}
export function is_lookup_action(a: Action): a is LookupAction {
    return a.type === "lookup";
}

export function within_maze(p: Pos, m: Maze): boolean {
    return p.x >= 0 && p.y >= 0 && p.x < m.width && p.y < m.height;
}
export function verify_path(path: Path, m: Maze): boolean {
    let p = m.start;

    for (const a of path) {
        if (is_move_action(a)) {
            p = step_in_dir(p, a.dir);
            if (is_wall(get_cell(p, m))) {
                return false;
            }
        } else if (!within_maze(a.pos, m)) {
            return false;
        }
    }

    return pos_eq(p, m.end);
}

/**
 * Creates a maze from strings where ' ' means empty, '#' means wall, 'S' means start and 'E' means end
 * @param strs array containing strings describing the rows of the maze
 * @returns null if maze is invalid or the described maze otherwise
 */
export function make_maze(strs: string[]): Maze | null {
    let start: Pos | null = null;
    let end: Pos | null = null;

    // 0 size mazes are disallowed
    const height = strs.length;
    if (height === 0) return null;
    const width = strs[0].length;
    if (width === 0) return null;

    // initialize to correct size filled with null
    const cells: (Cell | null)[][] = Array.from(Array(height), () => new Array(width).fill(null));

    for (let y = 0; y < height; y++) {
        // rows of different sizes
        if (width !== strs[y].length) return null

        for (let x = 0; x < width; x++) {
            const char = strs[y][x];
            switch (char) {
                case " ":
                    cells[y][x] = EMPTY_CELL;
                    break;
                case "#":
                    cells[y][x] = WALL_CELL;
                    break;
                case "S":
                    cells[y][x] = EMPTY_CELL;
                    if (start !== null) return null; // only allow one start
                    start = make_pos(x, y);
                    break;
                case "E":
                    cells[y][x] = EMPTY_CELL;
                    if (end !== null) return null; // only allow one end
                    end = make_pos(x, y);
                    break;
                default:
                    return null; // unrecognized character
            }
        }
    }

    // check that nothing is null
    if (start === null || end === null) return null;

    return {
        start,
        end,
        width,
        height,
        cells: cells as Cell[][] // ts can't deduce that it must be filled
    }
}
/**
 * Constructs a path of only movements from a string where 'W' means up, 'A' means left, 'S' means down and 'D' means right.
 * @param str string describing the actions of the path
 * @returns null if path is invalid or the described path otherwise
 */
export function make_path(str: string): Path | null {
    const path: Path = [];

    for (let i = 0; i < str.length; i++) {
        const char = str[i];
        switch (char) {
            case "W":
                path.push(move_action("up"));
                break;
            case "A":
                path.push(move_action("left"));
                break;
            case "S":
                path.push(move_action("down"));
                break;
            case "D":
                path.push(move_action("right"));
                break;
            default:
                return null; // unrecognized character
        }
    }

    return path;
}
export function join_paths(a: Path, b: Path): Path {
    return a.concat(b);
}

export function draw_cell(val: Cell, p: Pos): void { }
export function draw_maze(m: Maze): void { }
