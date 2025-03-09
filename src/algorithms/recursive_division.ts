import type { Grid, Node } from "../components/Board.tsx";

type Axis = "H" | "V";

/**
 * Generates a maze using the recursive division algorithm and returns a new grid.
 * @param grid - The grid to generate the maze from
 * @returns A new grid containing the maze
 */
export function recursive_division(grid: Grid): Grid {
    // Deep copy of grid
    const maze: Grid = {
        nodes: grid.nodes.map((row: Node[]) => row.map((node: Node) => ({ ...node }))),
        start: { ...grid.start },
        end: { ...grid.end },
        rows: grid.rows,
        cols: grid.cols,
    };

    // Make borders
    for (let row: number = 0; row < maze.rows; row++) {
        for (const col of [0, maze.cols - 1]) {
            make_wall(maze.nodes[row][col]);
        }
    }
    for (let col: number = 0; col < maze.cols; col++) {
        for (const row of [0, maze.rows - 1]) {
            make_wall(maze.nodes[row][col]);
        }
    }

    // Divide within the borders
    divide(maze, 1, maze.rows - 2, 1, maze.cols - 2, get_axis(maze.rows - 2, maze.cols - 2));

    return maze;
}

/**
 * Recursively divide grid into smaller sections, adding horizontal and vertical walls with passage openings,
 * until the sections reach a minimum size.
 * @param grid - The grid to divide
 * @param r1 - Starting row index of section
 * @param r2 - Ending row index of section
 * @param c1 - Starting column index of section
 * @param c2 - Ending column index of section
 * @param axis - The axis of the section to be divided
 */
function divide(grid: Grid, r1: number, r2: number, c1: number, c2: number, axis: Axis): void {
    if (r2 - r1 < 2 || c2 - c1 < 2) return;  // Exit early if section reaches minimum size (variant)

    const walls: number[] = [];  // Possible walls
    for (let i: number = (axis === "H" ? r1 : c1) + 1; i <= (axis === "H" ? r2 : c2) - 1; i++) {
        if (i % 2 === 0) walls.push(i);
    }
    if (walls.length === 0) return;  // No possible walls
    const wall: number = choice(walls);

    const passages: number[] = [];  // Possible passages
    for (let i: number = (axis === "H" ? c1 : r1); i <= (axis === "H" ? c2 : r2); i++) {
        if (i % 2 === 1) passages.push(i);
    }
    const passage: number = choice(passages);

    // Create a horizontal or vertical wall with a passage
    for (let i: number = (axis === "H" ? c1 : r1); i <= (axis === "H" ? c2 : r2); i++) {
        if (i !== passage) {
            const node: Node = axis === "H" ? grid.nodes[wall][i] : grid.nodes[i][wall];
            make_wall(node);
        }
    }

    // Recurse with updated boundaries and axes
    if (axis === "H") {
        divide(grid, r1, wall - 1, c1, c2, get_axis(wall - r1, c2 - c1 + 1));
        divide(grid, wall + 1, r2, c1, c2, get_axis(r2 - wall, c2 - c1 + 1));
    } else {
        divide(grid, r1, r2, c1, wall - 1, get_axis(r2 - r1 + 1, wall - c1));
        divide(grid, r1, r2, wall + 1, c2, get_axis(r2 - r1 + 1, c2 - wall));
    }
}

// Choose a random element from an array
function choice<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
}

// Determines whether to divide the grid along a horizontal or vertical axis
function get_axis(height: number, width: number): Axis {
    if (width < height) {
        return "H";
    } else if (height < width) {
        return "V";
    } else {
        return Math.random() < 0.5 ? "H" : "V";
    }
}

// Set isWall property of a node to true if not the start node or end node
function make_wall(node: Node): void {
    if (!node.isStart && !node.isEnd) {
        node.isWall = true;
    }
}
