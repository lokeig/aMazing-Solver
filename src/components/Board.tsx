import { useState, useRef, useCallback } from "react";
import { produce } from "immer";

interface Node {
    row: number;
    col: number;
    isWall: boolean;
    isVisited: boolean;
    distance: number;
    previous: Node | null;
}

interface Grid {
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
            updateGrid({ ...node, isWall: false });
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

    const styles = (node: Node): string => (
        isSameNode(node, grid.start) ? "bg-emerald-500 animate-node border-0" :
        isSameNode(node, grid.end) ? "bg-red-500 animate-node border-0" :
        node.isWall ? "bg-slate-700 animate-node border-0" :
        "border border-slate-200"
    );

    return (
        <div className="flex items-center justify-center size-full select-none">
            <div className="flex flex-col border border-slate-200" onMouseUp={handleMouseUp}>
                {grid.nodes.map((row, i) => (
                    <div key={i} className="flex flex-row">
                        {row.map((node) => (
                            <div
                                key={`${node.row}-${node.col}`}
                                className={`size-8 ${styles(node)}`}
                                onMouseDown={() => handleMouseDown(node)}
                                onMouseEnter={() => handleMouseEnter(node)}
                            />
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
}

function makeNode(row: number, col: number): Node {
    return { row, col, isWall: false, isVisited: false, distance: Infinity, previous: null };
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
    return { nodes, start, end };
}

function isSameNode(a: Node, b: Node): boolean {
    return a.row === b.row && a.col === b.col;
}

export default Board;
