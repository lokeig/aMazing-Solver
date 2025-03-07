import type { Grid, Node } from "./components/Board.tsx";

/**
 * Get the ID of a node based on its row and column indices.
 * @param row
 * @param col
 * @returns string
 */
export function getNodeID(row: number, col: number): string {
    return `node-${row}-${col}`;
}

/**
 * Creates a 2D grid.
 * @param rows
 * @param cols
 * @returns Grid
 */
export function makeGrid(rows: number, cols: number): Grid {
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
