import type { JSX, Context, ReactNode, Dispatch, SetStateAction } from "react";
import { createContext, useContext, useState } from "react";

// Define types for state variables and stateful logic
export type EditorProps = {
    code: string;
    setCode: Dispatch<SetStateAction<string>>;
    log: string;
    setLog: Dispatch<SetStateAction<string>>;
};

type Children = {
    children: ReactNode;
};

const EditorContext: Context<EditorProps | null> = createContext<EditorProps | null>(null);

/**
 * Provides the context to child components.
 * @param children - Child components
 * @returns The EditorProvider component
 */
export function EditorProvider({ children }: Children): JSX.Element {
    const [code, setCode] = useState<string>("");
    const [log, setLog] = useState<string>("");
    return (
        <EditorContext.Provider value={{ code, setCode, log, setLog }}>
            {children}
        </EditorContext.Provider>
    );
}

/**
 * Custom Hook to access context.
 * Must be used within a component wrapped by EditorProvider.
 * @throws {Error} If the Hook is used outside EditorProvider
 * @returns The state variables and stateful logic
 */
export function useEditor(): EditorProps {
    const context: EditorProps | null = useContext(EditorContext);
    if (!context) {
        throw new Error("useEditor must be used within EditorProvider");
    }
    return context;
}
