import type { ReactNode, Dispatch, SetStateAction } from "react";
import { createContext, useContext, useState } from "react";
import type { Grid } from "./Board.tsx";
import { makeGrid } from "../utils.ts";

type GridState = {
    grid: Grid;
    setGrid: Dispatch<SetStateAction<Grid>>;
};

type Children = {
    children: ReactNode;
};

const GridContext = createContext<GridState | null>(null);

export function GridProvider({ children }: Children) {
    const [grid, setGrid] = useState<Grid>(makeGrid(0, 0));
    return (
        <GridContext.Provider value={{ grid, setGrid }}>
            {children}
        </GridContext.Provider>
    );
}

export function useGrid(): GridState {
    const context: GridState | null = useContext(GridContext);
    if (!context) {
        throw new Error("useGrid must be used within a GridProvider");
    }
    return context;
}
