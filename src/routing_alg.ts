import { Direction, get_cell, is_wall, lookup_action, make_pos, move_action, pos_eq, step_in_dir, within_maze, type Maze, type MazeSolver, type Path, type Pos } from "./maze";

function MD(p: Pos, q: Pos): number {
    return Math.abs(p.x - q.x) + Math.abs(p.y - q.y);
}

function try_move(p: Pos, dir: Direction, m: Maze, path: Path): [Pos, boolean] {
    const next_pos = step_in_dir(p, dir);
    if (within_maze(next_pos, m)) {
        path.push(lookup_action(next_pos));
        if (!is_wall(get_cell(next_pos, m))) {
            path.push(move_action(dir));
            return [next_pos, true];
        }
    }
    return [p, false]

}

function find_productive_path(src: Pos, dst: Pos, m: Maze, path: Path): Direction | null {
    if (src.x < dst.x) {
        const next = step_in_dir(src, "right");
        if (within_maze(next, m)) {
            path.push(lookup_action(next));
            if (!is_wall(get_cell(next, m))) {
                return "right";
            }
        }
    } else if (src.x > dst.x) {
        const next = step_in_dir(src, "left");
        if (within_maze(next, m)) {
            path.push(lookup_action(next));
            if (!is_wall(get_cell(next, m))) {
                return "left";
            }
        }
    }

    if (src.y < dst.y) {
        const next = step_in_dir(src, "down");
        if (within_maze(next, m)) {
            path.push(lookup_action(next));
            if (!is_wall(get_cell(next, m))) {
                return "down";
            }
        }
    } else if (src.y > dst.y) {
        const next = step_in_dir(src, "up");
        if (within_maze(next, m)) {
            path.push(lookup_action(next));
            if (!is_wall(get_cell(next, m))) {
                return "up";
            }
        }
    }

    return null;
}

function left_selection_try_order(src: Pos, dst: Pos): Direction[] {
    if (src.x < dst.x) {
        if (src.y > dst.y) {
            return ["left", "down"];
        } else if (src.y < dst.y) {
            return ["up", "left"];
        } else {
            return ["up", "left", "down"];
        }
    } else if (src.x > dst.x) {
        if (src.y > dst.y) {
            return ["down", "right"];
        } else if (src.y < dst.y) {
            return ["right", "up"];
        } else {
            return ["down", "right", "up"];
        }
    } else {
        if (src.y > dst.y) {
            return ["right", "up", "left"];
        } else if (src.y < dst.y) {
            return ["left", "down", "right"];
        } else {
            return [];
        }
    }
}

// could use the fact that there is no productive path to optimize lookups
function right_hand_rule_try_order(src: Pos, dst: Pos, last_move: Direction): Direction[] {
    switch (last_move) {
        case "up":
            return ["right", "up", "left", "down"];
        case "down":
            return ["left", "down", "right", "up"];
        case "left":
            return ["up", "left", "down", "right"];
        case "right":
            return ["down", "right", "up", "left"];
    }
}

// explanation: https://en.wikipedia.org/wiki/Maze-solving_algorithm#Maze-routing_algorithm
// won't always halt when in an unsolvable maze
export const maze_routing_alg: MazeSolver = (m: Maze) => {
    const path: Path = [];

    let cur: Pos = m.start;
    let MD_best = MD(m.start, m.end);

    while (!pos_eq(cur, m.end)) {
        const productive_dir = find_productive_path(cur, m.end, m, path);
        if (productive_dir !== null) {
            path.push(move_action(productive_dir))
            cur = step_in_dir(cur, productive_dir);
        } else {
            MD_best = MD(cur, m.end);
            const try_order = left_selection_try_order(cur, m.end);
            let last_move: Direction | null = null;
            for (const dir of try_order) {
                let success: boolean;
                [cur, success] = try_move(cur, dir, m, path);
                if (success) {
                    last_move = dir;
                    break;
                }
            }

            if (last_move === null) {
                return [];
            } else {
                while (MD(cur, m.end) !== MD_best || find_productive_path(cur, m.end, m, path) === null) {
                    const try_order = right_hand_rule_try_order(cur, m.end, last_move);
                    for (const dir of try_order) {
                        let success: boolean;
                        [cur, success] = try_move(cur, dir, m, path);
                        if (success) {
                            last_move = dir;
                            break;
                        }
                    }
                }
            }
        }
    }

    return path;
}