import type { JSX, Context, ReactNode, Dispatch, SetStateAction } from "react";
import { createContext, useContext, useState } from "react";

type EditorState = {
    code: string;
    setCode: Dispatch<SetStateAction<string>>;
    log: string;
    setLog: Dispatch<SetStateAction<string>>;
};

type Children = {
    children: ReactNode;
};

const EditorContext: Context<EditorState | null> = createContext<EditorState | null>(null);

export function EditorProvider({ children }: Children): JSX.Element {
    const [code, setCode] = useState<string>("");
    const [log, setLog] = useState<string>("");
    return (
        <EditorContext.Provider value={{ code, setCode, log, setLog }}>
            {children}
        </EditorContext.Provider>
    );
}

export function useEditor(): EditorState {
    const context: EditorState | null = useContext(EditorContext);
    if (!context) {
        throw new Error("useEditor must be used within an EditorProvider");
    }
    return context;
}
