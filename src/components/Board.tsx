import { useState, useRef, useEffect, useCallback } from "react";
import { produce } from "immer";
import clsx from "clsx";
import { A_Star } from "../algorithms/a_star.ts";
import { dijkstra } from "../algorithms/dijkstra.ts";
import { maze_routing_alg } from "../algorithms/routing_alg.ts";
import { Maze, MazeSolver, step_in_dir, WALL_CELL, EMPTY_CELL } from "../maze.ts";

export interface Node {
    row: number;
    col: number;
    isStart?: boolean;
    isEnd?: boolean;
    isWall?: boolean;
    isVisited?: boolean;
    isPath?: boolean;
}

export interface Grid {
    nodes: Node[][];
    start: Node;
    end: Node;
    rows: number;
    cols: number;
}

function Board() {
    const [grid, setGrid] = useState<Grid>(makeGrid(0, 0));
    const [mouseDown, setMouseDown] = useState<boolean>(false);
    const boardRef = useRef<HTMLDivElement>(null);
    const moveNodeRef = useRef<"start" | "end" | null>(null);
    const editWallRef = useRef<"add" | "remove" | null>(null);

    useEffect(() => {
        if (!boardRef.current) return;
        const { width, height } = boardRef.current.getBoundingClientRect();
        const rows = Math.floor(height / 32);
        const cols = Math.floor(width / 32);
        setGrid(makeGrid(rows, cols));
    }, []);

    const updateGrid = useCallback((node: Node): void => {
        setGrid(produce((draft) => {
            if (moveNodeRef.current === "start") {
                draft.nodes[draft.start.row][draft.start.col].isStart = undefined;
                draft.start = draft.nodes[node.row][node.col];
                draft.start.isStart = true;
            } else if (moveNodeRef.current === "end") {
                draft.nodes[draft.end.row][draft.end.col].isEnd = undefined;
                draft.end = draft.nodes[node.row][node.col];
                draft.end.isEnd = true;
            } else {
                const target = draft.nodes[node.row][node.col];
                draft.nodes[node.row][node.col] = { ...target, ...node };
            }
        }));
    }, []);

    const handleMouseDown = (node: Node): void => {
        setMouseDown(true);
        if (node.isStart) {
            moveNodeRef.current = "start";
        } else if (node.isEnd) {
            moveNodeRef.current = "end";
        } else {
            editWallRef.current = node.isWall ? "remove" : "add";
            updateGrid({ row: node.row, col: node.col, isWall: !node.isWall });
        }
    };

    const handleMouseUp = (): void => {
        setMouseDown(false);
        moveNodeRef.current = null;
        editWallRef.current = null;
    };

    const handleMouseEnter = (node: Node): void => {
        if (!mouseDown) return;
        if (moveNodeRef.current) {
            if (node.isStart || node.isEnd || node.isWall) return;
            updateGrid(node);
        } else if (editWallRef.current) {
            if (node.isStart || node.isEnd) return;
            updateGrid({ row: node.row, col: node.col, isWall: editWallRef.current === "add" });
        }
    };

    const styles = (node: Node): string => clsx({
        "start": node.isStart,
        "end": node.isEnd,
        "wall": node.isWall,
        "search": node.isVisited && !node.isPath,
        "path": node.isPath,
    });

    return (
        <div ref={boardRef} className="board" onMouseUp={handleMouseUp}>
            <button className="mt-4 p-2 bg-blue-500 text-white rounded" onClick={() => solveMaze(grid, dijkstra, setGrid)}>
                test Dijkstra
            </button>
            <table>
                <tbody>
                {grid.nodes.map((row, i) => (
                    <tr key={i}>
                        {row.map((node, j) => (
                            <td
                                key={j}
                                className={clsx(styles(node), "node")}
                                onMouseDown={() => handleMouseDown(node)}
                                onMouseEnter={() => handleMouseEnter(node)}
                            />
                        ))}
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
}

function makeGrid(rows: number, cols: number): Grid {
    if (rows > 0 && cols > 0) {
        const nodes: Node[][] = Array.from({ length: rows }, (_, row) =>
            Array.from({ length: cols }, (_, col) => ({ row, col }))
        );
        const start = nodes[Math.floor(rows / 2)][Math.floor(cols / 4)];
        const end = nodes[Math.floor(rows / 2)][Math.floor(3 * cols / 4)];
        start.isStart = true;
        end.isEnd = true;
        return { rows, cols, nodes, start, end };
    } else {
        return { rows: 0, cols: 0, nodes: [], start: { row: 0, col: 0 }, end: { row: 0, col: 0 } }
    }
}

function gridToMaze(grid: Grid): Maze {
    return {
        start: { x: grid.start.col, y: grid.start.row },
        end: { x: grid.end.col, y: grid.end.row },
        width: grid.nodes[0].length,
        height: grid.nodes.length,
        cells: grid.nodes.map(row =>
            row.map(node => (node.isWall ? WALL_CELL : EMPTY_CELL))
        ),
    };
}

function solveMaze(grid: Grid, solver: MazeSolver, setGrid: (grid: Grid) => void) {
    const maze = gridToMaze(grid);
    const actions = solver(maze);

    const seenLookups = new Set<string>();
    const filteredActions = actions.filter((action) => {
        if (action.type === "lookup") {
            const key = `${action.pos.x},${action.pos.y}`;
            if (seenLookups.has(key)) {
                return false;
            }
            seenLookups.add(key);
        }
        return true;
    });

    let newGrid = grid;
    let currentPos = { ...maze.start };

    filteredActions.forEach((action, i) => {
        setTimeout(() => {
            if (action.type === "lookup") {
                newGrid = produce(newGrid, (draft) => {
                    const node = draft.nodes[action.pos.y][action.pos.x];
                    if (
                        !node.isPath && !node.isStart && !node.isEnd && !node.isWall
                    ) {
                        node.isVisited = true;
                    }
                });
            } else if (action.type === "move") {
                currentPos = step_in_dir(currentPos, action.dir);
                newGrid = produce(newGrid, (draft) => {
                    draft.nodes[currentPos.y][currentPos.x].isPath = true;
                });
            }
            setGrid(newGrid);
        }, i * 10);
    });
}


export default Board;
