import { MazeSolver, within_maze, is_wall, pos_eq, get_cell, move_action, make_maze
    type Maze, type Path, type Pos, type Direction, 
    step_in_dir} from "./maze";

const heuristic = (p: Pos, goal: Pos): number => {
    return Math.abs(p.x - goal.x) + Math.abs(p.y - goal.y);
};
type Node = {
    pos: Pos,
    cost: number,     // g(n)
    priority: number, // g(n) + h(n)
    path: Path
}
export const A_Star: MazeSolver = (maze: Maze): Path => {
   const pending: Node[] = [{
       pos: maze.start,
       cost: 0,
       priority: heuristic(maze.start, maze.end),
       path: []
   }]
   const visited = new Set<string>();

   while (pending.length > 0) {
       pending.sort((a, b) => a.priority - b.priority)
       const current = pending[0];
       pending.splice(0, 1);

       const pos_to_string = (pos: Pos): string => `${pos.x}, ${pos.y}`
       visited.add(pos_to_string(current.pos));

       if (pos_eq(current.pos, maze.end)) {
           return current.path;
       }

       type Neighbor = { direction: Direction, pos: Pos }
       const neighbors: Neighbor[] = [
           { direction: "up", pos: step_in_dir(current.pos, "up") },
           { direction: "down", pos:  step_in_dir(current.pos, "down") },
           { direction: "left", pos:  step_in_dir(current.pos, "left") },
           { direction: "right", pos:  step_in_dir(current.pos, "right") }
       ];
       
       for (let neighbor of neighbors) {
           if (!within_maze(neighbor.pos, maze)) {
               continue;
           }
           // Adds to pending if not a wall and hasn't been checked before
           if (!is_wall(get_cell(neighbor.pos, maze)) && !visited.has(pos_to_string(neighbor.pos))) {
               pending.push({
                   pos: neighbor.pos,
                   cost: current.cost + 1,
                   priority: heuristic(neighbor.pos, maze.end) + current.cost+1,
                   path: [...current.path, move_action(neighbor.direction)]
               })
           }
       }
   }
   // Impossible Maze
   return [];
}
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
console.log(A_Star(maze));