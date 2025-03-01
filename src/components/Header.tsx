import { useState } from "react";
import { useGrid } from "./GridContext.tsx";
import { Grid, Node } from "./Board.tsx";
import { MazeSolver } from "../maze.ts";
import { visualize } from "../visualizer.ts";
import { makeGrid, getNodeID } from "../utils.ts";
import { recursiveDivision } from "../algorithms/recursive_division.ts";
import { dijkstra } from "../algorithms/dijkstra.ts";
import { A_Star } from "../algorithms/a_star.ts";
import { maze_routing_alg } from "../algorithms/routing_alg.ts";
import { Button, Listbox, ListboxButton, ListboxOption, ListboxOptions } from "@headlessui/react";
import { ChevronDownIcon, PlayIcon } from "@heroicons/react/24/outline";

type Algorithm = {
    id: number;
    name: string;
    fn: MazeSolver;
}

const algorithms: Algorithm[] = [
    { id: 0, name: "Dijkstra", fn: dijkstra },
    { id: 1, name: "A*", fn: A_Star },
    { id: 2, name: "Maze Routing", fn: maze_routing_alg },
];

function Header() {
    const { grid, setGrid } = useGrid();
    const [selected, setSelected] = useState(algorithms[0]);

    const clearSearch = (): void => {
        if (!document.querySelector(".search, .path")) return;
        grid.nodes.flat().map((node: Node): void => {
            const cell: HTMLElement | null = document.getElementById(getNodeID(node.row, node.col));
            cell?.classList.remove("search", "path");
        });
    }

    const clearBoard = (): void => {
        if (!document.querySelector(".wall, .search, .path")) return;
        setGrid((prev: Grid): Grid => makeGrid(prev.rows, prev.cols));
        clearSearch();
    };

    const run = async () => {
        clearSearch();
        await visualize(grid, selected.fn);
    }

    const generateMaze = (): void => {
        clearBoard();
        setGrid((prev: Grid): Grid => recursiveDivision(prev));
    };

    return (
        <header>
            <div className="bg-gray-800 p-4 flex shadow-lg">
                <div className="w-full flex items-center justify-between">
                    <h1 className="relative text-white text-3xl">aMazing Solver</h1>

                    <div className="flex items-center space-x-4">
                        <div className="relative">
                            <Listbox value={selected} onChange={setSelected}>
                                <ListboxButton className="flex items-center justify-between w-48 bg-gray-700 text-white px-5 py-3 rounded-lg shadow-md cursor-pointer hover:bg-gray-600">
                                    {selected.name} <ChevronDownIcon className="h-5 w-5 ml-2" />
                                </ListboxButton>
                                <ListboxOptions className="absolute mt-2 w-full bg-gray-700 text-white rounded-lg shadow-md">
                                    {algorithms.map((algo: Algorithm) => (
                                        <ListboxOption key={algo.id} value={algo} className="px-4 py-2 cursor-pointer m-1 rounded-md select-none hover:bg-gray-600">
                                            {algo.name}
                                        </ListboxOption>
                                    ))}
                                </ListboxOptions>
                            </Listbox>
                        </div>

                        <Button
                            className="flex items-center bg-gray-700 text-white px-5 py-3 rounded-lg shadow-md cursor-pointer hover:bg-gray-600"
                            onClick={generateMaze}
                        >
                            Generate Maze
                        </Button>

                        <Button
                            className="flex items-center bg-red-700 text-white px-5 py-3 rounded-lg shadow-md cursor-pointer hover:bg-red-600"
                            onClick={clearBoard}
                        >
                            Clear Board
                        </Button>
                    </div>

                    <div className="flex space-x-4">
                        <Button
                            className="flex items-center bg-indigo-700 text-white px-5 py-3 rounded-lg shadow-md cursor-pointer hover:bg-indigo-600"
                            onClick={run}
                        >
                            <PlayIcon className="h-5 w-5 mr-2" /> Run
                        </Button>
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-center text-gray-800 space-x-8 mt-8">
                <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-emerald-500" />
                    <span>Start Node</span>
                </div>
                <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-red-500"></div>
                    <span>End Node</span>
                </div>
                <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-gray-800"></div>
                    <span>Wall</span>
                </div>
                <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-indigo-500"></div>
                    <span>Visited Node</span>
                </div>
                <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-yellow-300"></div>
                    <span>Path</span>
                </div>
            </div>
        </header>
    );
}

export default Header;