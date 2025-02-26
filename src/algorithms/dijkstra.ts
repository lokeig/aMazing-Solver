import {
    type MazeSolver, type Pos, type Direction,
    is_wall, pos_eq, step_in_dir, solver_wrapper, make_maze
} from "../maze";

type Node = {
    pos: Pos,
    parent: Node | null
    path: Direction | null
    length: number

}

const walk_path = (n: Node, move: (d: Direction) => void) => {
    if (n.parent !== null && n.path !== null) {
        walk_path(n.parent, move);
        move(n.path);
    }
}
export const dijkstra: MazeSolver = solver_wrapper((
    goal,
    cur,
    in_bound,
    lookup,
    move
) => {
    const pos_to_string = (pos: Pos): string => `${pos.x}, ${pos.y}`;

    const pending: Node[] = [{pos: cur(), parent: null, path: null, length: 0}];
    const visited = new Set<string>();

    while (pending.length > 0) {
        pending.sort((a, b) => a.length - b.length);
        const current = pending.pop()!;
        
        type Neighbor = { direction: Direction, pos: Pos }
        if (pos_eq(current.pos, goal)) {
            walk_path(current, move);
            return;
        }

        visited.add(pos_to_string(current.pos));

        const neighbors: Neighbor[] = [
            { direction: "up", pos: step_in_dir(current.pos, "up") },
            { direction: "down", pos: step_in_dir(current.pos, "down") },
            { direction: "left", pos: step_in_dir(current.pos, "left") },
            { direction: "right", pos: step_in_dir(current.pos, "right") }
        ];
        for (let neighbor of neighbors) {
            if (!visited.has(pos_to_string(neighbor.pos)) && !is_wall(lookup(neighbor.pos))) {
                pending.push({
                    pos: neighbor.pos,
                    parent: current,
                    path: neighbor.direction,
                    length: current.length+1
                })
            }
        }
    }
    return;
});
