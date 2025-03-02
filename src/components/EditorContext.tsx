import type { ReactNode, Dispatch, SetStateAction } from "react";
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

const EditorContext = createContext<EditorState | null>(null);

export function EditorProvider({ children }: Children) {
    const [code, setCode] = useState<string>("# Write your algorithm here");
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
