import {
    type Direction, type MazeSolver, type Pos, type Cell,
    is_wall, pos_eq, solver_wrapper, step_in_dir,
} from "../maze";

// manhattan distance
function MD(p: Pos, q: Pos): number {
    return Math.abs(p.x - q.x) + Math.abs(p.y - q.y);
}

// move in dir of no wall, returns wether we moved
function try_move(p: Pos, dir: Direction, lookup: (p: Pos) => Cell, move: (d: Direction) => void): boolean {
    if (!is_wall(lookup(step_in_dir(p, dir)))) {
        move(dir);
        return true;
    } else {
        return false;
    }
}

// find a direction without a wall that takes us closer to the goal, or null if it doesn't exist
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

// the order of direction to the left of the line from src to dst with productive paths removed
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
            return ["left", "down", "right"];
        } else if (src.y < dst.y) {
            return ["right", "up", "left"];
        } else {
            return [];
        }
    }
}

// the order of directions to try when following the right hand on wall algorithm
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

/**
 * A MazeSolver using the Maze Routing algorithm.
 * Won't always halt when in an unsolvable maze.
 */
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
                    const at_best = MD(cur(), goal) === MD_best;
                    if (at_best && cur().x < goal.x && dir === "right") continue;
                    if (at_best && cur().x > goal.x && dir === "left") continue;
                    if (at_best && cur().y < goal.y && dir === "down") continue;
                    if (at_best && cur().y > goal.y && dir === "up") continue;

                    if (try_move(cur(), dir, lookup, move)) {
                        last_move = dir;
                        break;
                    }
                }
            }
        }
    }
});
