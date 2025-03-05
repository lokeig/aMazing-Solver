import { useRef, useEffect } from "react";
import { useGrid } from "./GridContext.tsx";
import { makeGrid, getNodeID } from "../utils.ts";
import clsx from "clsx";

export type Node = {
    row: number;
    col: number;
    isStart?: boolean;
    isEnd?: boolean;
    isWall?: boolean;
};

export type Grid = {
    nodes: Node[][];
    start: Node;
    end: Node;
    rows: number;
    cols: number;
};

function Board() {
    const { grid, setGrid, disabled } = useGrid();
    const boardRef = useRef<HTMLDivElement>(null);
    const wallRef = useRef<"add" | "remove" | null>(null);
    const nodeRef = useRef<"start" | "end" | null>(null);

    useEffect((): void => {
        if (!boardRef.current) return;
        const { width, height } = boardRef.current.getBoundingClientRect();
        const rows: number = Math.floor(height / 24);
        const cols: number = Math.floor(width / 24);
        setGrid(makeGrid(rows, cols));
    }, [setGrid]);

    const editWall = (row: number, col: number): void => {
        const node: Node = grid.nodes[row][col];
        const cell: HTMLElement | null = document.getElementById(getNodeID(row, col));
        if (cell && !node.isStart && !node.isEnd) {
            if (wallRef.current === "add") {
                node.isWall = true;
                cell.classList.add("wall");
            } else if (wallRef.current === "remove") {
                node.isWall = false;
                cell.classList.remove("wall");
            }
        }
    };

    const moveNode = (row: number, col: number): void => {
        if (grid.nodes[row][col].isWall) return;
        if ((nodeRef.current === "start" && grid.end.row === row && grid.end.col === col) ||
            (nodeRef.current === "end" && grid.start.row === row && grid.start.col === col)) {
            return;
        }
        if (nodeRef.current) {
            const node: Node = nodeRef.current === "start" ? grid.start : grid.end;
            document.getElementById(getNodeID(node.row, node.col))?.classList.remove(nodeRef.current);
            document.getElementById(getNodeID(row, col))?.classList.add(nodeRef.current);
            if (nodeRef.current === "start") {
                grid.start = { ...grid.start, row, col };
            } else {
                grid.end = { ...grid.end, row, col };
            }
        }
    };

    const updateGrid = (): void => {
        setGrid((prev: Grid): Grid => {
            const nodes: Node[][] = prev.nodes.map((row: Node[], i: number): Node[] =>
                row.map((node: Node, j: number): Node => ({
                    row: node.row,
                    col: node.col,
                    isWall: node.isWall,
                    isStart: i === prev.start.row && j === prev.start.col,
                    isEnd: i === prev.end.row && j === prev.end.col,
                }))
            );
            return { ...prev, nodes };
        });
    };

    const handleMouseDown = (row: number, col: number): void => {
        const node: Node = grid.nodes[row][col];
        if (node.isStart) {
            nodeRef.current = "start";
        } else if (node.isEnd) {
            nodeRef.current = "end";
        } else {
            wallRef.current = node.isWall ? "remove" : "add";
            editWall(row, col);
        }
    };

    const handleMouseEnter = (row: number, col: number): void => {
        if (nodeRef.current) {
            moveNode(row, col);
        } else if (wallRef.current) {
            editWall(row, col);
        }
    };

    const handleMouseUp = (): void => {
        wallRef.current = null;
        nodeRef.current = null;
        updateGrid();
    };

    const styles = (node: Node): string => clsx({
        "start": node.isStart,
        "end": node.isEnd,
        "wall": node.isWall,
    });

    return (
        <div ref={boardRef} className={clsx({"disabled": disabled}, "board")} onMouseUp={handleMouseUp}>
            <table>
                <tbody>
                {grid.nodes.map((row: Node[], i: number) => (
                    <tr key={i}>
                        {row.map((node: Node, j: number) => (
                            <td
                                key={j}
                                id={getNodeID(node.row, node.col)}
                                className={clsx(styles(node), "node")}
                                onMouseDown={(): void => handleMouseDown(node.row, node.col)}
                                onMouseEnter={(): void => handleMouseEnter(node.row, node.col)}
                            />
                        ))}
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
}

export default Board;
