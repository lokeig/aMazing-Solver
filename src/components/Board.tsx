import { useState, useRef, useCallback } from "react";
import { produce } from "immer";
import clsx from "clsx";

export interface Node {
    row: number;
    col: number;
    isWall?: boolean;
    isVisited?: boolean;
    isPath?: boolean;
}

export interface Grid {
    rows: number;
    cols: number;
    nodes: Node[][];
    start: Node;
    end: Node;
}

function Board() {
    const [grid, setGrid] = useState<Grid>(makeGrid());
    const [mouseDown, setMouseDown] = useState<boolean>(false);
    const moveNodeRef = useRef<"start" | "end" | null>(null);
    const editWallRef = useRef<"add" | "remove" | null>(null);

    const updateGrid = useCallback((node: Node): void => {
        setGrid(produce((draft) => {
            const target = draft.nodes[node.row][node.col];
            draft.nodes[node.row][node.col] = { ...target, ...node };
            if (moveNodeRef.current === "start") {
                draft.start = draft.nodes[node.row][node.col];
            } else if (moveNodeRef.current === "end") {
                draft.end = draft.nodes[node.row][node.col];
            }
        }));
    }, []);

    const handleMouseDown = (node: Node): void => {
        setMouseDown(true);
        if (isSameNode(node, grid.start)) {
            moveNodeRef.current = "start";
        } else if (isSameNode(node, grid.end)) {
            moveNodeRef.current = "end";
        } else {
            editWallRef.current = node.isWall ? "remove" : "add";
            updateGrid({ ...node, isWall: !node.isWall });
        }
    };

    const handleMouseEnter = (node: Node): void => {
        if (!mouseDown) return;
        if (moveNodeRef.current) {
            if (node.isWall || isSameNode(node, grid.start) || isSameNode(node, grid.end)) return;
            updateGrid({ ...node });
        } else if (editWallRef.current) {
            if (isSameNode(node, grid.start) || isSameNode(node, grid.end)) return;
            updateGrid({ ...node, isWall: editWallRef.current === "add" });
        }
    };

    const handleMouseUp = (): void => {
        setMouseDown(false);
        moveNodeRef.current = null;
        editWallRef.current = null;
    };

    const styles = (node: Node): string => clsx({
        "start": isSameNode(node, grid.start),
        "end": isSameNode(node, grid.end),
        "wall": node.isWall,
    });

    return (
        <div className="board" onMouseUp={handleMouseUp}>
            <table>
                <tbody>
                {grid.nodes.map((row, i) => (
                    <tr key={i}>
                        {row.map((node) => (
                            <td
                                key={`${node.row}-${node.col}`}
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

function makeNode(row: number, col: number): Node {
    return { row, col };
}

function getGridSize(): number[] {
    const cols: number = Math.floor(window.innerWidth / 32);
    const rows: number = Math.floor(window.innerHeight / 32);
    return [rows, cols];
}

function makeGrid(): Grid {
    const [rows, cols] = getGridSize();
    const nodes: Node[][] = Array.from({ length: rows }, (_, row) =>
        Array.from({ length: cols }, (_, col) => makeNode(row, col))
    );
    const start: Node = nodes[Math.floor(rows / 2)][Math.floor(cols / 4)];
    const end: Node = nodes[Math.floor(rows / 2)][Math.floor(3 * cols / 4)];
    return { rows, cols, nodes, start, end };
}

function isSameNode(a: Node, b: Node): boolean {
    return a.row === b.row && a.col === b.col;
}

export default Board;
