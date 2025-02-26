import {
    type Direction, type MazeSolver, type Pos, type Cell,
    is_wall, pos_eq, solver_wrapper, step_in_dir,
} from "../maze.ts";

function MD(p: Pos, q: Pos): number {
    return Math.abs(p.x - q.x) + Math.abs(p.y - q.y);
}

function try_move(p: Pos, dir: Direction, lookup: (p: Pos) => Cell, move: (d: Direction) => void): boolean {
    if (!is_wall(lookup(step_in_dir(p, dir)))) {
        move(dir);
        return true;
    } else {
        return false;
    }
}

function find_productive_path(src: Pos, dst: Pos, lookup: (p: Pos) => Cell): Direction | null {
    if (src.x < dst.x && !is_wall(lookup(step_in_dir(src, "right")))) {
        return "right";
    } else if (src.x > dst.x && !is_wall(lookup(step_in_dir(src, "left")))) {
        return "left";
    } else if (src.y < dst.y && !is_wall(lookup(step_in_dir(src, "down")))) {
        return "down";
    } else if (src.y > dst.y && !is_wall(lookup(step_in_dir(src, "up")))) {
        return "up";
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

function right_hand_rule_try_order(last_move: Direction): Direction[] {
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
export const maze_routing_alg: MazeSolver = solver_wrapper((
    goal,
    cur,
    in_bound,
    lookup,
    move
) => {
    let MD_best = MD(cur(), goal);
    while (!pos_eq(cur(), goal)) {
        const productive_dir = find_productive_path(cur(), goal, lookup);
        if (productive_dir !== null) {
            move(productive_dir);
        } else {
            MD_best = MD(cur(), goal);
            const try_order = left_selection_try_order(cur(), goal);
            let last_move: Direction | null = null;
            for (const dir of try_order) {
                if (try_move(cur(), dir, lookup, move)) {
                    last_move = dir;
                    break;
                }
            }

            // unsolvable
            if (last_move === null) return;

            while (MD(cur(), goal) !== MD_best || find_productive_path(cur(), goal, lookup) === null) {
                const try_order = right_hand_rule_try_order(last_move);
                for (const dir of try_order) {
                    // don't double check same dir after noting there is no productive path
                    if (MD(cur(), goal) === MD_best && cur().x < goal.x && dir === "right") continue;
                    if (MD(cur(), goal) === MD_best && cur().x > goal.x && dir === "left") continue;
                    if (MD(cur(), goal) === MD_best && cur().y < goal.y && dir === "up") continue;
                    if (MD(cur(), goal) === MD_best && cur().y > goal.y && dir === "down") continue;

                    if (try_move(cur(), dir, lookup, move)) {
                        last_move = dir;
                        break;
                    }
                }
            }
        }
    }
});
