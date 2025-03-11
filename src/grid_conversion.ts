import { type Maze, type Cell, type Pos, make_pos, pos_eq, get_cell, is_wall } from "./maze";
import { type Grid, type Node } from "./components/Board"

/**
 * Converts a Grid to a Maze.
 * @param grid - The grid to convert
 * @returns A Maze representation of the grid
 */
export function grid_to_maze(grid: Grid): Maze {
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
 * Converts a Maze to a Grid.
 * @param maze - The maze to convert
 * @returns A Grid representation of the grid
 */
export function maze_to_grid(maze: Maze): Grid {
    const nodes: Node[][] = Array.from({ length: maze.height }, (_, row: number): Node[] =>
        Array.from({ length: maze.width }, (_, col: number): Node => {
            const node: Node = { col, row };
            const pos: Pos = make_pos(col, row);
            if (pos_eq(maze.start, pos)) node.isStart = true;
            if (pos_eq(maze.end, pos)) node.isEnd = true;
            if (is_wall(get_cell(pos, maze))) node.isWall = true;
            return node;
        })
    );
    return {
        start: nodes[maze.start.y][maze.start.x],
        end: nodes[maze.end.y][maze.end.x],
        cols: maze.width,
        rows: maze.height,
        nodes
    };
}
