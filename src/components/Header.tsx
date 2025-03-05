import type { Node, Grid } from "./Board.tsx";
import type { MazeSolver } from "../maze.ts";
import { useState, useEffect } from "react";
import { useEditor } from "./EditorContext.tsx";
import { useGrid } from "./GridContext.tsx";
import { makeGrid, getNodeID } from "../utils.ts";
import { visualize } from "../visualizer.ts";
import { recursiveDivision } from "../algorithms/recursive_division.ts";
import { dijkstra } from "../algorithms/dijkstra.ts";
import { A_Star } from "../algorithms/a_star.ts";
import { maze_routing_alg } from "../algorithms/routing_alg.ts";
import { amazing_dijkstra, amazing_a_star, amazing_routing_alg, amazing_dfs } from "../algorithms/amazing_impl.ts";
import Editor from "./Editor.tsx";
import { evaluate_solver } from "../interpreter/evaluator.ts";
import { Button, Listbox, ListboxButton, ListboxOption, ListboxOptions, Transition } from "@headlessui/react";
import { ChevronDownIcon, CodeBracketIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import { dfs } from "../algorithms/dfs.ts";

type Algorithm = {
    id: number;
    name: string;
    fn: MazeSolver;
    impl: string;
};

const algorithms: Algorithm[] = [
    { id: 0, name: "Dijkstra", fn: dijkstra, impl: amazing_dijkstra },
    { id: 1, name: "A*", fn: A_Star, impl: amazing_a_star },
    { id: 2, name: "DFS", fn: dfs, impl: amazing_dfs },
    { id: 3, name: "Maze Routing", fn: maze_routing_alg, impl: amazing_routing_alg },
    { id: 4, name: "Custom", fn: (): never[] => [], impl: "# Implement your algorithm here" },
];

function Header() {
    const { grid, setGrid, disabled, setDisabled } = useGrid();
    const { code, setCode, setLog } = useEditor();

    const [editor, setEditor] = useState<boolean>(false);
    const [selected, setSelected] = useState<Algorithm>(algorithms[0]);

    const clearSearch = (): void => {
        if (!document.querySelector(".search, .path")) return;
        grid.nodes.flat().map((node: Node): void => {
            const cell: HTMLElement | null = document.getElementById(getNodeID(node.row, node.col));
            cell?.classList.remove("search", "path");
        });
    };

    const clearBoard = (): void => {
        if (!document.querySelector(".wall, .search, .path")) return;
        setGrid((prev: Grid): Grid => makeGrid(prev.rows, prev.cols));
        clearSearch();
    };

    const generateMaze = (): void => {
        clearBoard();
        setGrid((prev: Grid): Grid => recursiveDivision(prev));
    };

    useEffect((): void => {
        setCode(selected.impl);
    }, [selected, setCode]);

    const run = async (): Promise<void> => {
        const editing: boolean = editor;
        clearSearch();
        setDisabled(true);
        try {
            if (editing) setEditor(false);
            const solver: MazeSolver = selected.name === "Custom" || editing
                ? evaluate_solver(code)[0]
                : selected.fn;
            await visualize(grid, solver);
        } catch (error) {
            console.error(error);
            if (editing) {
                setLog(String(error));
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

export default Header;
