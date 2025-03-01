import { Grid, Node } from "../components/Board.tsx";

type Axis = "H" | "V";

export function recursiveDivision(grid: Grid): Grid {
    const maze: Grid = {
        nodes: grid.nodes.map((row: Node[]) => row.map((node: Node) => ({ ...node }))),
        start: { ...grid.start },
        end: { ...grid.end },
        rows: grid.rows,
        cols: grid.cols,
    };

    for (let row: number = 0; row < maze.rows; row++) {
        for (const col of [0, maze.cols - 1]) {
            setWall(maze.nodes[row][col]);
        }
    }
    for (let col: number = 0; col < maze.cols; col++) {
        for (const row of [0, maze.rows - 1]) {
            setWall(maze.nodes[row][col]);
        }
    }

    divide(maze, 1, grid.rows - 2, 1, maze.cols - 2, getAxis(maze.rows - 2, maze.cols - 2));

    return maze;
}

function divide(grid: Grid, r1: number, r2: number, c1: number, c2: number, axis: Axis): void {
    if (r2 - r1 < 2 || c2 - c1 < 2) return;

    const walls: number[] = [];
    for (let i: number = (axis === "H" ? r1 : c1) + 1; i <= (axis === "H" ? r2 : c2) - 1; i++) {
        if (i % 2 === 0) walls.push(i);
    }
    if (walls.length === 0) return;
    const wall: number = choice(walls);

    const passages: number[] = [];
    for (let i: number = (axis === "H" ? c1 : r1); i <= (axis === "H" ? c2 : r2); i++) {
        if (i % 2 === 1) passages.push(i);
    }
    const passage: number = choice(passages);

    for (let i: number = (axis === "H" ? c1 : r1); i <= (axis === "H" ? c2 : r2); i++) {
        if (i === passage) continue;
        const node: Node = axis === "H" ? grid.nodes[wall][i] : grid.nodes[i][wall];
        setWall(node);
    }

    if (axis === "H") {
        divide(grid, r1, wall - 1, c1, c2, getAxis(wall - r1, c2 - c1 + 1));
        divide(grid, wall + 1, r2, c1, c2, getAxis(r2 - wall, c2 - c1 + 1));
    } else {
        divide(grid, r1, r2, c1, wall - 1, getAxis(r2 - r1 + 1, wall - c1));
        divide(grid, r1, r2, wall + 1, c2, getAxis(r2 - r1 + 1, c2 - wall));
    }
}

function choice<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
}

function getAxis(height: number, width: number): Axis {
    if (width < height) {
        return "H";
    } else if (height < width) {
        return "V";
    } else {
        return Math.random() < 0.5 ? "H" : "V";
    }
}

function setWall(node: Node): void {
    if (!node.isStart && !node.isEnd) {
        node.isWall = true;
    }
}
