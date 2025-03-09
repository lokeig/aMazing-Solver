import type { Grid, Node } from "./components/Board.tsx";
import type { Maze, MazeSolver, Cell, Path, Pos } from "./maze.ts";
import { step_in_dir, is_lookup_action, is_move_action } from "./maze.ts";
import { get_node_id } from "./utils.ts";

/**
 * Converts a Grid to a Maze.
 * @param grid - The grid to convert
 * @returns A Maze representation of the grid
 */
function grid_to_maze(grid: Grid): Maze {
    return {
        start: { x: grid.start.col, y: grid.start.row },
        end: { x: grid.end.col, y: grid.end.row },
        width: grid.nodes[0].length,
        height: grid.nodes.length,
        cells: grid.nodes.map((row: Node[]): Cell[] =>
            row.map((node: Node): Cell => (node.isWall ? "wall" : "empty"))
        ),
    };
}

/**
 * Asynchronous function to visualize algorithms on a grid.
 * Adds a 10 milliseconds delay between steps.
 * Manipulates DOM to add class attributes that show the visualization.
 * @param grid - The grid to solve
 * @param solver - The maze-solving algorithm to visualize
 * @returns A Promise that resolves when the visualization is complete
 */
export async function visualize(grid: Grid, solver: MazeSolver): Promise<void> {
    const maze: Maze = grid_to_maze(grid);
    const actions: Path = solver(maze);

    let cur: Pos = { ...maze.start };
    for (const action of actions) {
        await new Promise<void>((resolve): void => {
            setTimeout((): void => {
                if (is_lookup_action(action)) {
                    const node: Node = grid.nodes[action.pos.y][action.pos.x];
                    const cell: HTMLElement | null = document.getElementById(get_node_id(node.row, node.col));
                    if (!node.isStart && !node.isEnd && !node.isWall) {
                        cell?.classList.add("search");
                    }
                } else if (is_move_action(action)) {
                    cur = step_in_dir(cur, action.dir);
                    const node: Node = grid.nodes[cur.y][cur.x];
                    const cell: HTMLElement | null = document.getElementById(get_node_id(node.row, node.col));
                    cell?.classList.add("path");
                }
                resolve();  // Asynchronous operation complete
            }, 10);
        });
    }
}
