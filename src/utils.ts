import type { Grid, Node } from "./components/Board.tsx";

/**
 * Get the ID of a node based on its row and column indices.
 * @param row - The row index of the node
 * @param col - The column index of the node
 * @returns A unique identifier
 */
export function get_node_id(row: number, col: number): string {
    return `node-${row}-${col}`;
}

/**
 * Creates a 2D grid of nodes with a start node and end node.
 * @param rows - The number of rows in the grid
 * @param cols - The number of columns in the grid
 * @returns A 2D grid
 */
export function make_grid(rows: number, cols: number): Grid {
    if (rows > 0 && cols > 0) {
        const nodes: Node[][] = Array.from({length: rows}, (_, row: number): Node[] =>
            Array.from({length: cols}, (_, col: number): Node => ({row, col}))
        );
        const start: Node = nodes[Math.floor(rows / 2)][Math.floor(cols / 4)];
        const end: Node = nodes[Math.floor(rows / 2)][Math.floor(3 * cols / 4)];
        start.isStart = true;
        end.isEnd = true;
        return { rows, cols, nodes, start, end };
    }
    return {
        rows: 0,
        cols: 0,
        nodes: [],
        start: { row: 0, col: 0 },
        end: { row: 0, col: 0 }
    };
}
