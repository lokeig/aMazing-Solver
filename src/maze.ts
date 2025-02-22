
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

export function pos_eq(p: Pos, q: Pos): boolean {
    return p.x === q.x && p.y === q.y;
}
export function get_cell(p: Pos, m: Maze): Cell {
    return m.cells[p.y][p.x];
}
export function is_wall(c: Cell): boolean {
    return c === "wall";
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
            switch (a.dir) {
                case "up":
                    p.y--;
                    break;
                case "down":
                    p.y++;
                    break;
                case "left":
                    p.x--;
                    break;
                case "right":
                    p.x++;
                    break;
            }

            if (is_wall(get_cell(p, m))) {
                return false;
            }

        } else if (!within_maze(a.pos, m)) {
            return false;
        }
    }

    return pos_eq(p, m.end);
}

export function set_cell(val: Cell, p: Pos, m: Maze): void { }
export function draw_cell(val: Cell, p: Pos): void { }
export function draw_maze(m: Maze): void { }
