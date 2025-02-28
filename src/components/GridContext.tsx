import { ReactNode, Dispatch, SetStateAction, createContext, useContext, useState } from "react";
import { Grid } from "./Board.tsx";
import { makeGrid } from "../utils.ts";

interface GridState {
    grid: Grid;
    setGrid: Dispatch<SetStateAction<Grid>>;
}

const GridContext = createContext<GridState>({
    grid: makeGrid(0, 0),
    setGrid: () => {
        throw new Error("setGrid was called outside of GridProvider");
    },
});

export const GridProvider = ({ children }: { children: ReactNode }) => {
    const [grid, setGrid] = useState<Grid>(makeGrid(0, 0));

    return (
        <GridContext.Provider value={{ grid, setGrid }}>
            {children}
        </GridContext.Provider>
    );
};

export const useGrid = (): GridState => {
    return useContext<GridState>(GridContext);
};
