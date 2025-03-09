import type { JSX, KeyboardEvent, ChangeEvent, RefObject } from "react";
import { useRef } from "react";
import { type EditorProps, useEditor } from "./EditorContext.tsx";
import { DocumentIcon } from "@heroicons/react/24/outline";

/**
 * A simple code editor for implementing algorithms and displaying errors.
 * @returns The Editor component
 */
export function Editor(): JSX.Element {
    const { code, setCode, log }: EditorProps = useEditor();
    const editorRef: RefObject<HTMLTextAreaElement | null> = useRef<HTMLTextAreaElement | null>(null);

    // Insert tab indents with the tab key
    const handleKeyDown = (e: KeyboardEvent): void => {
        if (e.key === "Tab") {
            e.preventDefault();  // Prevent default behavior of tab key
            const textarea: HTMLTextAreaElement | null = editorRef.current;
            if (!textarea) return;

            // Cursor start and end positions
            const start: number = textarea.selectionStart;
            const end: number = textarea.selectionEnd;

            // Insert tab character
            setCode(code.slice(0, start) + "\t" + code.slice(end));

            // Defer setting the cursor position
            requestAnimationFrame((): void => {
                textarea.setSelectionRange(start + 1, start + 1);
            });
        }
    };

    return (
        <div className="absolute w-3/5 h-7/10 left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-xl bg-gray-800">
            <div className="relative flex flex-col justify-center w-full h-full">
                <div className="flex flex-row items-center justify-between p-6 text-gray-500">
                    <h3>Code Editor</h3>
                    <a href="https://github.com/lokeig/aMazing-Solver.git" target="_blank" rel="noopener noreferrer">
                        <DocumentIcon className="w-5 h-5 hover:text-white cursor-pointer" />
                    </a>
                </div>
                <div className="w-full h-px bg-gray-500" />
                <textarea
                    ref={editorRef}
                    className="w-full h-4/5 p-6 whitespace-pre-wrap font-mono text-white resize-none focus:outline-none"
                    spellCheck={false}
                    value={code}
                    onChange={(e: ChangeEvent<HTMLTextAreaElement>): void => setCode(e.target.value)}
                    onKeyDown={handleKeyDown}
                />
                <div className="w-full h-px bg-gray-500" />
                <textarea
                    className="w-full h-1/5 p-6 font-mono text-red-400 resize-none focus:outline-none"
                    readOnly={true}
                    spellCheck={false}
                    value={log}
                    onChange={(e: ChangeEvent<HTMLTextAreaElement>): void => setCode(e.target.value)}
                    onKeyDown={handleKeyDown}
                />
            </div>
        </div>
    );
}
