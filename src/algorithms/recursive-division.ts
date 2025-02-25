import {Grid, Node} from "../components/Board.tsx";

export function recursiveDivision(grid: Grid): void {
    for (let row = 0; row < grid.rows; row++) {
        for (const col of [0, grid.cols - 1]) {
            setWall(grid.nodes[row][col], grid.start, grid.end);
        }
    }
    for (let col = 0; col < grid.cols; col++) {
        for (const row of [0, grid.rows - 1]) {
            setWall(grid.nodes[row][col], grid.start, grid.end);
        }
    }

    divide(grid, 1, grid.rows - 2, 1, grid.cols - 2, getAxis(grid.rows - 2, grid.cols - 2));
}

function divide(grid: Grid, r1: number, r2: number, c1: number, c2: number, axis: "H" | "V") {
    if (r2 < r1 || c2 < c1) return;

    const walls = [];
    for (let i = (axis === "H" ? r1 : c1) + 1; i <= (axis === "H" ? r2 : c2) - 1; i++) {
        if (i % 2 === 0) walls.push(i);
    }
    if (!walls.length) return;
    const wall = choice(walls);

    const passages = [];
    for (let i = (axis === "H" ? c1 : r1); i <= (axis === "H" ? c2 : r2); i++) {
        if (i % 2 === 1) passages.push(i);
    }
    const passage = choice(passages);

    for (let i = (axis === "H" ? c1 : r1); i <= (axis === "H" ? c2 : r2); i++) {
        if (i === passage) continue;
        const node = axis === "H" ? grid.nodes[wall][i] : grid.nodes[i][wall];
        setWall(node, grid.start, grid.end);
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

function getAxis(height: number, width: number): "H" | "V" {
    if (width < height) {
        return "H";
    } else if (height < width) {
        return "V";
    } else {
        return Math.random() < 0.5 ? "H" : "V";
    }
}

function setWall(node: Node, start: Node, end: Node): void {
    if (!isSameNode(node, start) && !isSameNode(node, end)) {
        node.isWall = true;
    }
}

function isSameNode(a: Node, b: Node): boolean {
    return a.row === b.row && a.col === b.col;
}
