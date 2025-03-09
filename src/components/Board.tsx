import type { JSX, RefObject } from "react";
import { useRef, useEffect } from "react";
import { useGrid } from "./GridContext.tsx";
import { make_grid, get_node_id } from "../utils.ts";
import clsx from "clsx";

/**
 * Represents a single cell in the grid.
 * @invariant isStart and isEnd cannot both be true
 * @invariant isWall can be true only if isStart and isEnd are false
 */
export type Node = {
    row: number;
    col: number;
    isStart?: boolean;
    isEnd?: boolean;
    isWall?: boolean;
};

/**
 * Represents the entire grid as a 2D array of nodes.
 * @invariant The start node and end node cannot be the same
 */
export type Grid = {
    nodes: Node[][];
    start: Node;
    end: Node;
    rows: number;
    cols: number;
};

/**
 * An interactive grid containing nodes.
 * The Board allows users to place walls, and move the start and end nodes.
 * @returns The Board component
 */
export function Board(): JSX.Element {
    const { grid, setGrid, disabled } = useGrid();
    const boardRef: RefObject<HTMLDivElement | null> = useRef<HTMLDivElement | null>(null);
    const wallRef: RefObject<"add" | "remove" | null> = useRef<"add" | "remove" | null>(null);
    const nodeRef: RefObject<"start" | "end" | null> = useRef<"start" | "end" | null>(null);

    // Update grid with dimensions of boardRef on mount
    useEffect((): void => {
        if (!boardRef.current) return;
        const { width, height } = boardRef.current.getBoundingClientRect();  // Get width and height
        const rows: number = Math.floor(height / 24);  // 24-pixel cell size
        const cols: number = Math.floor(width / 24);
        setGrid(make_grid(rows, cols));  // Update grid
    }, []);

    // Toggle a wall node
    const editWall = (row: number, col: number): void => {
        const node: Node = grid.nodes[row][col];
        const cell: HTMLElement | null = document.getElementById(get_node_id(row, col));
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

    // Move the start or end node to a new position
    const moveNode = (row: number, col: number): void => {
        if (grid.nodes[row][col].isWall) return;
        if ((nodeRef.current === "start" && grid.end.row === row && grid.end.col === col) ||
            (nodeRef.current === "end" && grid.start.row === row && grid.start.col === col)) {
            return;
        }
        if (nodeRef.current) {
            const node: Node = nodeRef.current === "start" ? grid.start : grid.end;
            document.getElementById(get_node_id(node.row, node.col))?.classList.remove(nodeRef.current);
            document.getElementById(get_node_id(row, col))?.classList.add(nodeRef.current);
            if (nodeRef.current === "start") {
                grid.start = { ...grid.start, row, col };
            } else {
                grid.end = { ...grid.end, row, col };
            }
        }
    };

    // Update the grid state
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

    // Mouse event handlers
    const handleMouseDown = (row: number, col: number): void => {
        const node: Node = grid.nodes[row][col];
        if (node.isStart) {
            nodeRef.current = "start";  // Interacting with start node
        } else if (node.isEnd) {
            nodeRef.current = "end";  // Interacting with end node
        } else {
            wallRef.current = node.isWall ? "remove" : "add";  // Assign remove or add action
            editWall(row, col);  // Remove or add wall
        }
    };

    const handleMouseEnter = (row: number, col: number): void => {
        if (nodeRef.current) {
            moveNode(row, col);  // Move start or end node
        } else if (wallRef.current) {
            editWall(row, col);
        }
    };

    const handleMouseUp = (): void => {
        wallRef.current = null;  // Reset refs
        nodeRef.current = null;
        updateGrid();  // Batch updates
    };

    // Get class attribute for a given node
    const styles = (node: Node): string => clsx({
        "start": node.isStart,
        "end": node.isEnd,
        "wall": node.isWall,
    });

    return (
        <div ref={boardRef} className={clsx({"disabled": disabled}, "board")} onMouseUp={handleMouseUp}>
            <table>
                <tbody>
                {grid.nodes.map((row: Node[], i: number): JSX.Element => (
                    <tr key={i}>
                        {row.map((node: Node): JSX.Element => {
                            const id: string = get_node_id(node.row, node.col);
                            return (
                                <td
                                    key={id}
                                    id={id}
                                    className={clsx(styles(node), "node")}
                                    onMouseDown={(): void => handleMouseDown(node.row, node.col)}
                                    onMouseEnter={(): void => handleMouseEnter(node.row, node.col)}
                                />
                            );
                        })}
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
}
