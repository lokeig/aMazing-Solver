import type { JSX } from "react"
import { useState, useEffect } from "react";
import { type EditorProps, useEditor } from "./EditorContext.tsx";
import { type GridProps, useGrid } from "./GridContext.tsx";
import type { Node, Grid } from "./Board.tsx";
import type { MazeSolver } from "../maze.ts";
import { make_grid, get_node_id } from "../utils.ts";
import { visualize } from "../visualizer.ts";
import { recursive_division } from "../algorithms/recursive_division.ts";
import { dijkstra } from "../algorithms/dijkstra.ts";
import { a_star } from "../algorithms/a_star.ts";
import { dfs } from "../algorithms/dfs.ts";
import { maze_routing_alg } from "../algorithms/routing_alg.ts";
import { amazing_dijkstra, amazing_a_star, amazing_routing_alg, amazing_dfs } from "../algorithms/amazing_impl.ts";
import { Editor } from "./Editor.tsx";
import { evaluate_solver } from "../interpreter/evaluator.ts";
import { Button, Listbox, ListboxButton, ListboxOption, ListboxOptions, Transition } from "@headlessui/react";
import { ChevronDownIcon, CodeBracketIcon, EyeSlashIcon } from "@heroicons/react/24/outline";

type Algorithm = {
    id: number;
    name: string;
    fn: MazeSolver;
    impl: string;
};

// Data structure for the dropdown and selected algorithm
const algorithms: Algorithm[] = [
    { id: 0, name: "Dijkstra", fn: dijkstra, impl: amazing_dijkstra },
    { id: 1, name: "A*", fn: a_star, impl: amazing_a_star },
    { id: 2, name: "DFS", fn: dfs, impl: amazing_dfs },
    { id: 3, name: "Maze Routing", fn: maze_routing_alg, impl: amazing_routing_alg },
    { id: 4, name: "Custom", fn: (): never[] => [], impl: "# Implement your algorithm here" },
];

/**
 * A Header to interface with other components and visualizer.
 * @returns The Header component
 */
export function Header(): JSX.Element {
    const { grid, setGrid, disabled, setDisabled }: GridProps = useGrid();
    const { code, setCode, setLog }: EditorProps = useEditor();

    const [editor, setEditor] = useState<boolean>(false);  // Show or hide code editor
    const [selected, setSelected] = useState<Algorithm>(algorithms[0]);  // Selected algorithm

    // Clear previous searches
    const clearSearch = (): void => {
        if (!document.querySelector(".search, .path")) return;  // Early exit if no cells have the selectors
        grid.nodes.flat().map((node: Node): void => {
            const cell: HTMLElement | null = document.getElementById(get_node_id(node.row, node.col));
            cell?.classList.remove("search", "path");
        });
    };

    // Reset the entire board
    const clearBoard = (): void => {
        if (!document.querySelector(".wall, .search, .path")) return;
        setGrid((prev: Grid): Grid => make_grid(prev.rows, prev.cols));
        clearSearch();
    };

    // Generate mazes with recursive division and update grid state
    const generateMaze = (): void => {
        clearBoard();
        setGrid((prev: Grid): Grid => recursive_division(prev));
    };

    // Display implementations in the code editor
    useEffect((): void => {
        setCode(selected.impl);
    }, [selected, setCode]);

    // Visualize algorithms
    const run = async (): Promise<void> => {
        const editing: boolean = editor;
        clearSearch();
        setDisabled(true);  // Disable interactions with the board and header
        try {
            if (editing) {
                setLog("");  // Clear logs
                setEditor(false);  // Hide code editor
            }
            // Run code if editor is open or "Custom" is selected, otherwise use selected algorithm
            const solver: MazeSolver = selected.name === "Custom" || editing
                ? evaluate_solver(code)[0]
                : selected.fn;
            await visualize(grid, solver);
        } catch (error) {
            if (editing) {
                setLog(String(error));  // Display errors in code editor
                setEditor(true);
            }
        } finally {
            setDisabled(false);
        }
    };

    return (
        <>
            <header className="z-30">
                <div className="flex bg-gray-800 p-4 shadow-lg">
                    <div className="flex items-center justify-between w-full">
                        <h1 className="text-white text-2xl">aMazing Solver</h1>
                        <div className="flex items-center space-x-4">
                            <Button
                                className="flex items-center p-2.5 rounded-lg cursor-pointer bg-gray-700 hover:bg-gray-600 text-white"
                                onClick={(): void => setEditor(!editor)}
                            >
                                {editor ? <EyeSlashIcon className="w-5 h-5" /> : <CodeBracketIcon className="w-5 h-5" />}
                            </Button>

                            <div className="relative">
                                <Listbox
                                    value={selected}
                                    onChange={setSelected}
                                    disabled={disabled}
                                >
                                    <ListboxButton className="flex items-center justify-between w-48 px-4 py-2 rounded-lg cursor-pointer bg-gray-700 enabled:hover:bg-gray-600 text-white disabled:text-gray-500">
                                        {selected.name} <ChevronDownIcon className="w-5 h-5 ml-2" />
                                    </ListboxButton>

                                    <ListboxOptions className="absolute w-full mt-2 rounded-lg bg-gray-700 text-white shadow-lg">
                                        {algorithms.map((algo: Algorithm) => (
                                            <ListboxOption
                                                key={algo.id}
                                                value={algo}
                                                className="px-3 py-2 rounded-md m-1 select-none cursor-pointer hover:bg-gray-600"
                                            >
                                                {algo.name}
                                            </ListboxOption>
                                        ))}
                                    </ListboxOptions>
                                </Listbox>
                            </div>

                            <Button
                                className="flex items-center px-4 py-2 rounded-lg cursor-pointer bg-gray-700 enabled:hover:bg-gray-600 text-white disabled:text-gray-500"
                                onClick={generateMaze}
                                disabled={disabled}
                            >
                                Generate Maze
                            </Button>

                            <Button
                                className="flex items-center px-4 py-2 rounded-lg cursor-pointer bg-red-700 enabled:hover:bg-red-600 text-white disabled:text-red-500"
                                onClick={clearBoard}
                                disabled={disabled}
                            >
                                Clear Board
                            </Button>
                        </div>

                        <div className="flex items-center space-x-4">
                            <Button
                                className="flex items-center px-4 py-2 rounded-lg cursor-pointer bg-indigo-700 enabled:hover:bg-indigo-600 text-white disabled:text-indigo-500"
                                onClick={run}
                                disabled={disabled}
                            >
                                Visualize
                            </Button>
                        </div>
                    </div>
                </div>
            </header>

            <div className="flex items-center justify-center space-x-8 mt-8 text-gray-800 z-10">
                <div className="flex items-center space-x-2">
                    <div className="node start" />
                    <span>Start Node</span>
                </div>

                <div className="flex items-center space-x-2">
                    <div className="node end"></div>
                    <span>End Node</span>
                </div>

                <div className="flex items-center space-x-2">
                    <div className="node search !border-0"></div>
                    <span>Visited Node</span>
                </div>

                <div className="flex items-center space-x-2">
                    <div className="node wall"></div>
                    <span>Wall</span>
                </div>

                <div className="flex items-center space-x-2">
                    <div className="node path"></div>
                    <span>Path</span>
                </div>
            </div>

            <Transition
                show={editor}
                enter="transition-opacity duration-300"
                enterFrom="opacity-0"
                enterTo="opacity-100"
                leave="transition-opacity duration-300"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
            >
                <div className="z-20">
                    <Editor />
                </div>
            </Transition>
        </>
    );
}
