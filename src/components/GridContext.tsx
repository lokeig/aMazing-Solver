import type { JSX, Context, ReactNode, Dispatch, SetStateAction } from "react";
import { createContext, useContext, useState } from "react";
import type { Grid } from "./Board.tsx";
import { make_grid } from "../utils.ts";

// Define types for state variables and stateful logic
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
 * Provides the context to child components.
 * @param children - Child components
 * @returns The GridProvider component
 */
export function GridProvider({ children }: Children): JSX.Element {
    const [grid, setGrid] = useState<Grid>(make_grid(0, 0));
    const [disabled, setDisabled] = useState<boolean>(false);
    return (
        <GridContext.Provider value={{ grid, setGrid, disabled, setDisabled }}>
            {children}
        </GridContext.Provider>
    );
}

/**
 * Custom Hook to access context.
 * Must be used within a component wrapped by GridProvider.
 * @throws {Error} If the Hook is used outside GridProvider
 * @returns The state variables and stateful logic
 */
export function useGrid(): GridProps {
    const context: GridProps | null = useContext(GridContext);
    if (!context) {
        throw new Error("useGrid must be used within GridProvider");
    }
    return context;
}
