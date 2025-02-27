import {
    type MazeSolver, type Pos, type Direction,
    is_wall, pos_eq, step_in_dir, solver_wrapper
} from "../maze.ts";

const heuristic = (p: Pos, goal: Pos): number => {
    return Math.abs(p.x - goal.x) + Math.abs(p.y - goal.y);
};
type Node = {
    pos: Pos,
    cost: number,     // g(n)
    priority: number, // g(n) + h(n)
    parent: Node | null,
    path: Direction | null
}
const walk_path = (n: Node, move: (d: Direction) => void) => {
    if (n.parent !== null && n.path !== null) {
        walk_path(n.parent, move);
        move(n.path);
    }
}
export const A_Star: MazeSolver = solver_wrapper((
    goal,
    cur,
    in_bound,
    lookup,
    move
) => {
    const pending: Node[] = [{
        pos: cur(),
        cost: 0,
        priority: heuristic(cur(), goal),
        parent: null,
        path: null
    }];

    const pos_to_string = (pos: Pos): string => `${pos.x}, ${pos.y}`
    const visited = new Set<string>();
    visited.add(pos_to_string(cur()));

    while (pending.length > 0) {
        pending.sort((a, b) => b.priority - a.priority)
        const current = pending.pop()!;

        if (pos_eq(current.pos, goal)) {
            walk_path(current, move);
            return;
        }

        type Neighbor = { direction: Direction, pos: Pos }
        const neighbors: Neighbor[] = [
            { direction: "up", pos: step_in_dir(current.pos, "up") },
            { direction: "down", pos: step_in_dir(current.pos, "down") },
            { direction: "left", pos: step_in_dir(current.pos, "left") },
            { direction: "right", pos: step_in_dir(current.pos, "right") }
        ];

        for (let neighbor of neighbors) {
            // Adds to pending if not a wall and hasn't been checked before
            if (!visited.has(pos_to_string(neighbor.pos)) && !is_wall(lookup(neighbor.pos))) {
                visited.add(pos_to_string(neighbor.pos));
                pending.push({
                    pos: neighbor.pos,
                    cost: current.cost + 1,
                    priority: heuristic(neighbor.pos, goal) + current.cost + 1,
                    parent: current,
                    path: neighbor.direction
                })
            }
        }
    }
    // Impossible Maze
    return;
});
