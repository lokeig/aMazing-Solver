import type { JSX, Context, ReactNode, Dispatch, SetStateAction } from "react";
import { createContext, useContext, useState } from "react";
import type { Grid } from "./Board.tsx";
import { makeGrid } from "../utils.ts";

type GridProps = {
    grid: Grid;
    setGrid: Dispatch<SetStateAction<Grid>>;
    disabled: boolean;
    setDisabled: Dispatch<SetStateAction<boolean>>;
};

type Children = {
    children: ReactNode;
};

const GridContext: Context<GridProps | null> = createContext<GridProps | null>(null);

/**
 * GridProvider wraps components that need access to GridProps.
 * @param children
 * @returns GridProvider
 */
export function GridProvider({ children }: Children): JSX.Element {
    const [grid, setGrid] = useState<Grid>(makeGrid(0, 0));
    const [disabled, setDisabled] = useState<boolean>(false);
    return (
        <GridContext.Provider value={{ grid, setGrid, disabled, setDisabled }}>
            {children}
        </GridContext.Provider>
    );
}

/**
 * A custom Hook to provide the context for other components.
 * @returns GridProps
 */
export function useGrid(): GridProps {
    const context: GridProps | null = useContext(GridContext);
    if (!context) {
        throw new Error("useGrid must be used within a GridProvider");
    }
    return context;
}
