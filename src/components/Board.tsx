import { useState, useRef, useEffect, useCallback } from "react";
import { produce } from "immer";
import clsx from "clsx";
import {
    Maze,
    MazeSolver,
    Action,
    LookupAction,
    MoveAction,
    Path,
    Pos,
    step_in_dir,
    WALL_CELL,
    EMPTY_CELL,
} from "../maze.ts";
import Header from "./Header.tsx";

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

    useEffect((): void => {
        if (!boardRef.current) return;
        const { width, height } = boardRef.current.getBoundingClientRect();
        const rows: number = Math.floor(height / 32);
        const cols: number = Math.floor(width / 32);
        setGrid(makeGrid(rows, cols));
    }, []);

    const clearGrid = (): void => setGrid(makeGrid(grid.rows, grid.cols));

    const updateGrid = useCallback((node: Node): void => {
        setGrid(produce((draft): void => {
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
        <>
            <Header grid={grid} setGrid={setGrid} visualize={visualize} clearGrid={clearGrid} />
            <div ref={boardRef} className="board" onMouseUp={handleMouseUp}>
                <table>
                    <tbody>
                    {grid.nodes.map((row: Node[], i: number) => (
                        <tr key={i}>
                            {row.map((node: Node, j: number) => (
                                <td
                                    key={j}
                                    className={clsx(styles(node), "node")}
                                    onMouseDown={(): void => handleMouseDown(node)}
                                    onMouseEnter={(): void => handleMouseEnter(node)}
                                />
                            ))}
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </>
    );
}

function makeGrid(rows: number, cols: number): Grid {
    if (rows > 0 && cols > 0) {
        const nodes: Node[][] = Array.from({ length: rows }, (_, row: number) =>
            Array.from({ length: cols }, (_, col: number) => ({ row, col }))
        );
        const start: Node = nodes[Math.floor(rows / 2)][Math.floor(cols / 4)];
        const end: Node = nodes[Math.floor(rows / 2)][Math.floor(3 * cols / 4)];
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
        cells: grid.nodes.map((row: Node[]) =>
            row.map((node: Node) => (node.isWall ? WALL_CELL : EMPTY_CELL))
        ),
    };
}

async function visualize(grid: Grid, solver: MazeSolver, setGrid: (grid: Grid) => void): Promise<void> {
    const maze: Maze = gridToMaze(grid);
    const solution: Path = solver(maze);

    const redundant = new Set<string>();
    const actions: Action[] = solution.filter((action: Action): boolean => {
        if (action.type === "lookup") {
            const key = `${action.pos.x}${action.pos.y}`;
            if (redundant.has(key)) {
                return false;
            }
            redundant.add(key);
        }
        return true;
    });

    const lookups: LookupAction[] = actions.filter((action: Action): action is LookupAction => action.type === "lookup")
    const moves: MoveAction[] = actions.filter((action: Action): action is MoveAction => action.type === "move")

    for (let i: number = 0; i < lookups.length; i++) {
        const action: LookupAction = lookups[i];
        await new Promise<void>((resolve) => {
            setTimeout((): void => {
                grid = produce(grid, (draft): void => {
                    const node = draft.nodes[action.pos.y][action.pos.x];
                    if (!node.isPath && !node.isStart && !node.isEnd && !node.isWall) {
                        node.isVisited = true;
                    }
                });
                setGrid(grid);
                resolve();
            }, 10);
        });
    }

    let cur: Pos = { ...maze.start };
    for (let i: number = 0; i < moves.length; i++) {
        const action: MoveAction = moves[i];
        await new Promise<void>((resolve): void => {
            setTimeout((): void => {
                cur = step_in_dir(cur, action.dir);
                grid = produce(grid, (draft): void => {
                    draft.nodes[cur.y][cur.x].isPath = true;
                });
                setGrid(grid);
                resolve();
            }, 10);
        });
    }
}


export default Board;
