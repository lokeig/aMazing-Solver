import { make_maze, verify_path } from "../../src/maze";
import { evaluate_solver } from "../../src/interpreter/evaluator";

const routing_alg_program = `
    var abs = fn (x) {
        if (x < 0) return -x;
        else return x;
    };

    var MD = fn (p_x, p_y, q_x, q_y) {
        return abs(p_x - q_x) + abs(p_y - q_y);
    };

    var try_move = fn (p_x, p_y, dir) {
        if (dir == right) {
            if (!is_wall(p_x + 1, p_y)) {
                move(dir);
                return true;
            } else return false;
        } else if (dir == up) {
            if (!is_wall(p_x, p_y - 1)) {
                move(dir);
                return true;
            } else return false;
        } else if (dir == left) {
            if (!is_wall(p_x - 1, p_y)) {
                move(dir);
                return true;
            } else return false;
        } else if (dir == down) {
            if (!is_wall(p_x, p_y + 1)) {
                move(dir);
                return true;
            } else return false;
        }
    };

    var find_productive_path = fn (src_x, src_y, dst_x, dst_y) {
        if (src_x < dst_x && !is_wall(src_x + 1, src_y)) {
            return right;
        } else if (src_x > dst_x && !is_wall(src_x - 1, src_y)) {
            return left;
        } else if (src_y < dst_y && !is_wall(src_x, src_y + 1)) {
            return down;
        } else if (src_y > dst_y && !is_wall(src_x, src_y - 1)) {
            return up;
        }

        return -1;
    };

    var left_selection_try_order = fn (src_x, src_y, dst_x, dst_y) {
        if (src_x < dst_x) {
            if (src_y > dst_y) {
                return [left, down];
            } else if (src_y < dst_y) {
                return [up, left];
            } else {
                return [up, left, down];
            }
        } else if (src_x > dst_x) {
            if (src_y > dst_y) {
                return [down, right];
            } else if (src_y < dst_y) {
                return [right, up];
            } else {
                return [down, right, up];
            }
        } else {
            if (src_y > dst_y) {
                return [left, down, right];
            } else if (src_y < dst_y) {
                return [right, up, left];
            } else {
                return [];
            }
        }
    };

    var right_hand_rule_try_order = fn (last_move) {
        if (last_move == up) {
            return [right, up, left, down];
        } else if (last_move == down) {
            return [left, down, right, up];
        } else if (last_move == left) {
            return [up, left, down, right];
        } else if (last_move == right) {
            return [down, right, up, left];
        }
    };

    var main = fn (goal_x, goal_y) {
        var MD_best = MD(get_x(), get_y(), goal_x, goal_y);
        while (get_x() != goal_x || get_y() != goal_y) {
            print(get_x(), get_y());
            var productive_dir = find_productive_path(get_x(), get_y(), goal_x, goal_y);
            if (productive_dir != -1) {
                move(productive_dir);
            } else {
                MD_best = MD(get_x(), get_y(), goal_x, goal_y);
                var try_order = left_selection_try_order(get_x(), get_y(), goal_x, goal_y);
                var last_move = -1;

                var i = 0;
                while (i < len(try_order)) {
                    var dir = try_order[i];
                    i = i + 1;

                    if (try_move(get_x(), get_y(), dir)) {
                        last_move = dir;
                        break;
                    }
                }

                # unsolvable
                if (last_move == -1) return;

                while (MD(get_x(), get_y(), goal_x, goal_y) != MD_best || find_productive_path(get_x(), get_y(), goal_x, goal_y) == -1) {
                    var try_order = right_hand_rule_try_order(last_move);

                    var i = 0;
                    while (i < len(try_order)) {
                        var dir = try_order[i];
                        i = i + 1;

                        # don't double check same dir after noting there is no productive path
                        var at_best = MD(get_x(), get_y(), goal_x, goal_y) == MD_best;
                        if (at_best && get_x() < goal_x && dir == right) continue;
                        if (at_best && get_x() > goal_x && dir == left) continue;
                        if (at_best && get_y() < goal_y && dir == up) continue;
                        if (at_best && get_y() > goal_y && dir == down) continue;

                        if (try_move(get_x(), get_y(), dir)) {
                            last_move = dir;
                            break;
                        }
                    }
                }
            }
        }
    };
`;

const [maze_routing_alg, _] = evaluate_solver(routing_alg_program);

test("routing alg only forward", () => {
    const maze = make_maze([
        "S ###",
        "# ###",
        "#   #",
        "###E#",
    ])!;
    const path = maze_routing_alg(maze);
    expect(verify_path(path, maze)).toBe(true);
});

test("routing alg no forks", () => {
    const maze = make_maze([
        "S    ",
        "#### ",
        "   # ",
        "E#   ",
    ])!;
    const path = maze_routing_alg(maze);
    expect(verify_path(path, maze)).toBe(true);
});

test("routing alg full", () => {
    const maze = make_maze([
        "## #### ##",
        "#S       #",
        "## #### ##",
        "#  #      ",
        "#  ## ####",
        "####     #",
        "#E# #### #",
        "# #   ## #",
        "#   #    #",
    ])!;
    const path = maze_routing_alg(maze);
    expect(verify_path(path, maze)).toBe(true);
});
