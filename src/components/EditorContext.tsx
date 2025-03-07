import type { JSX, Context, ReactNode, Dispatch, SetStateAction } from "react";
import { createContext, useContext, useState } from "react";

type EditorProps = {
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
 * EditorProvider wraps components that need access to EditorProps.
 * @param children
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
 * A custom Hook to provide the context for other components.
 * @returns EditorProps
 */
export function useEditor(): EditorProps {
    const context: EditorProps | null = useContext(EditorContext);
    if (!context) {
        throw new Error("useEditor must be used within an EditorProvider");
    }
    return context;
}
