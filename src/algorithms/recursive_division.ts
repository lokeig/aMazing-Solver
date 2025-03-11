import { Cell, EMPTY_CELL, make_pos, Maze, Pos, pos_eq, set_cell, WALL_CELL, type MazeGenerator } from "../maze.ts";

type Axis = "H" | "V";

/**
 * Generates a maze using the recursive division algorithm and returns a new grid.
 * @param grid - The grid to generate the maze from
 * @returns A new grid containing the maze
 */
export const recursive_division: MazeGenerator = (w, h) => {
    const start: Pos = make_pos(Math.floor(w / 4), Math.floor(h / 2));
    const end: Pos = make_pos(Math.floor(w * 3 / 4), Math.floor(h / 2));
    const cells: Cell[][] = Array.from({ length: h }, () => Array.from({ length: w }, () => EMPTY_CELL));

    const maze: Maze = {
        start,
        end,
        width: w,
        height: h,
        cells
    }

    // Make borders
    for (let x = 0; x < w; x++) {
        const top = make_pos(x, 0);
        if (!pos_eq(top, maze.start) && !pos_eq(top, maze.end)) {
            set_cell(WALL_CELL, top, maze);
        }

        const bottom = make_pos(x, h - 1);
        if (!pos_eq(bottom, maze.start) && !pos_eq(bottom, maze.end)) {
            set_cell(WALL_CELL, bottom, maze);
        }
    }
    for (let y = 0; y < h; y++) {
        set_cell(WALL_CELL, make_pos(0, y), maze);
        set_cell(WALL_CELL, make_pos(w - 1, y), maze);
    }

    // Divide within the borders
    divide(maze, 1, h - 2, 1, w - 2, get_axis(h - 2, w - 2));

    return maze;
}

/**
 * Recursively divide maze into smaller sections, adding horizontal and vertical walls with passage openings,
 * until the sections reach a minimum size.
 * @param maze - The maze to divide
 * @param r1 - Starting row index of section
 * @param r2 - Ending row index of section
 * @param c1 - Starting column index of section
 * @param c2 - Ending column index of section
 * @param axis - The axis of the section to be divided
 */
function divide(maze: Maze, r1: number, r2: number, c1: number, c2: number, axis: Axis): void {
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
            const pos = axis === "H" ? make_pos(i, wall) : make_pos(wall, i);
            if (!pos_eq(pos, maze.start) && !pos_eq(pos, maze.end)) {
                set_cell(WALL_CELL, pos, maze);
            }
        }
    }

    // Recursively with updated boundaries and axes
    if (axis === "H") {
        divide(maze, r1, wall - 1, c1, c2, get_axis(wall - r1, c2 - c1 + 1));
        divide(maze, wall + 1, r2, c1, c2, get_axis(r2 - wall, c2 - c1 + 1));
    } else {
        divide(maze, r1, r2, c1, wall - 1, get_axis(r2 - r1 + 1, wall - c1));
        divide(maze, r1, r2, wall + 1, c2, get_axis(r2 - r1 + 1, c2 - wall));
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
