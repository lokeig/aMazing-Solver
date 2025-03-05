export const amazing_routing_alg = `\
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

            for (var i = 0; i < len(try_order); i = i + 1) {
                var dir = try_order[i];

                if (try_move(get_x(), get_y(), dir)) {
                    last_move = dir;
                    break;
                }
            }

            # unsolvable
            if (last_move == -1) return;

            while (MD(get_x(), get_y(), goal_x, goal_y) != MD_best || find_productive_path(get_x(), get_y(), goal_x, goal_y) == -1) {
                var try_order = right_hand_rule_try_order(last_move);

                for (var i = 0; i < len(try_order); i = i + 1) {
                    var dir = try_order[i];

                    # don't double check same dir after noting there is no productive path
                    var at_best = MD(get_x(), get_y(), goal_x, goal_y) == MD_best;
                    if (at_best && get_x() < goal_x && dir == right) continue;
                    if (at_best && get_x() > goal_x && dir == left) continue;
                    if (at_best && get_y() < goal_y && dir == down) continue;
                    if (at_best && get_y() > goal_y && dir == up) continue;

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
export const amazing_a_star = `\
var abs = fn (x) {
    if (x < 0) return -x;
    else return x;
};

var heuristic = fn(src_x, src_y, dest_x, dest_y) {
    return abs(src_x - dest_x) + abs(src_y - dest_y);
};

var walk_path = fn(n) {
    if (n[4] != -1 && n[5] != -1) {
        walk_path(n[4]);
        move(n[5]);
    } 
};

var sort_by_prio = fn(array) {
    var new_arr = [];
    
    for (var i = 0; i < len(array); i = i + 1) {
        push(new_arr, array[i]);

        var j = len(new_arr) - 1;
        while (j > 1 && new_arr[j][3] > new_arr[j - 1][3]) {
            var temp = new_arr[j - 1];
            new_arr[j - 1] = new_arr[j];
            new_arr[j] = temp;
        }
    }

    return new_arr;
};

var contains = fn(arr, x, y) {
    for (var i = 0; i < len(arr); i = i + 1) {
        var cur = arr[i];
        if (cur[0] == x && cur[1] == y) {
            return true;
        }
    }
    return false;
};

var main = fn (goal_x, goal_y) {
    var pending = [[
        get_x(),                                     #0 - X-pos
        get_y(),                                     #1 - Y-Pos
        0,                                           #2 - Cost
        heuristic(get_x(), get_y(), goal_x, goal_y), #3 - Priority
        -1,                                          #4 - Parent
        -1                                           #5 - Path (right, left, up, down)
    ]];
    var visited = [[get_x(), get_y()]];
    while (len(pending) > 0) {
        pending = sort_by_prio(pending);
        var current = pop(pending);

        if (current[0] == goal_x && current[1] == goal_y) {
            walk_path(current);
            break;
        }

        var neighbors = [
        [current[0] - 1, current[1], left],          # 0, left
        [current[0] + 1, current[1], right],         # 1, right
        [current[0], current[1] - 1, up],            # 2, up
        [current[0], current[1] + 1, down]           # 3, down
        ];

        for (var i = 0; i < 4; i = i + 1) {
            var neighbor = neighbors[i];
            var x = neighbor[0];
            var y = neighbor[1];
            var direction = neighbor[2];

            if (!is_wall(x, y) && in_bound(x, y) && !contains(visited, x, y)) {
                push(visited, [x, y]);
                push(pending, [
                    x, 
                    y, 
                    current[2] + 1, 
                    current[2] + 1 + heuristic(x, y, goal_x, goal_y), 
                    current, 
                    direction
                ]);
            }
        } 
    } 
};
`;
export const amazing_dijkstra = `\
var walk_path = fn(n) {
    if (n[3] != -1 && n[4] != -1) {
        walk_path(n[3]);
        move(n[4]);
    } 
};

var sort_by_length = fn(array) {
    var new_arr = [];
    
    var i = 0;
    while (i < len(array)) {
        push(new_arr, array[i]);

        var j = len(new_arr) - 1;
        while (j > 1 && new_arr[j][2] > new_arr[j - 1][2]) {
            var temp = new_arr[j - 1];
            new_arr[j - 1] = new_arr[j];
            new_arr[j] = temp;
        }

        i = i + 1;
    }

    return new_arr;
};

var contains = fn(arr, x, y) {
    var i = 0;
    while (i < len(arr)) {
        var cur = arr[i];
        if (cur[0] == x && cur[1] == y) {
            return true;
        }
        i = i + 1;
    }
    return false;
};

var main = fn (goal_x, goal_y) {
    var pending = [[
        get_x(),                                     #0 - X-pos
        get_y(),                                     #1 - Y-Pos
        0,                                           #2 - Length
        -1,                                          #3 - Parent
        -1                                           #4 - Path (right, left, up, down)
    ]];
    var visited = [[get_x(), get_y()]];
    while (len(pending) > 0) {
        pending = sort_by_length(pending);
        var current = pop(pending);

        if (current[0] == goal_x && current[1] == goal_y) {
            walk_path(current);
            break;
        }

        var neighbors = [
        [current[0] - 1, current[1], left],          # 0, left
        [current[0] + 1, current[1], right],         # 1, right
        [current[0], current[1] - 1, up],            # 2, up
        [current[0], current[1] + 1, down]           # 3, down
        ];

        for (var i = 0; i < 4; i = i + 1) {
            var neighbor = neighbors[i];
            var x = neighbor[0];
            var y = neighbor[1];
            var direction = neighbor[2];

            if (!is_wall(x, y) && in_bound(x, y) && !contains(visited, x, y)) {
                push(visited, [x, y]);
                push(pending, [
                    x, 
                    y, 
                    current[2] + 1, 
                    current, 
                    direction
                ]);
            }
        } 
    } 
}; 
`;

export const amazing_dfs = `\
var walk_path = fn(n) {
    if (n[2] != -1 && n[3] != -1) {
        walk_path(n[2]);
        move(n[3]);
    } 
};

var contains = fn(arr, x, y) {
    var i = 0;
    while (i < len(arr)) {
        var cur = arr[i];
        if (cur[0] == x && cur[1] == y) {
            return true;
        }
        i = i + 1;
    }
    return false;
};

var main = fn (goal_x, goal_y) {
    var pending = [[
        get_x(),                                     #0 - X-pos
        get_y(),                                     #1 - Y-Pos
        -1,                                          #2 - Parent
        -1                                           #3 - Path (right, left, up, down)
    ]];
    var visited = [[get_x(), get_y()]];
    while (len(pending) > 0) {
        var current = pop(pending);

        if (current[0] == goal_x && current[1] == goal_y) {
            walk_path(current);
            break;
        }

        var neighbors = [
        [current[0] - 1, current[1], left],          # 0, left
        [current[0] + 1, current[1], right],         # 1, right
        [current[0], current[1] - 1, up],            # 2, up
        [current[0], current[1] + 1, down]           # 3, down
        ];

        for (var i = 0; i < 4; i = i + 1) {
            var neighbor = neighbors[i];
            var x = neighbor[0];
            var y = neighbor[1];
            var direction = neighbor[2];

            if (!is_wall(x, y) && in_bound(x, y) && !contains(visited, x, y)) {
                push(visited, [x, y]);
                push(pending, [
                    x, 
                    y, 
                    current, 
                    direction
                ]);
            }
        } 
    } 
}; 
`
