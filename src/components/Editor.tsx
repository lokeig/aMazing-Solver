import type { KeyboardEvent } from "react";
import { useRef } from "react";
import { useEditor } from "./EditorContext.tsx";
import { Textarea } from "@headlessui/react";
import { DocumentIcon } from "@heroicons/react/24/outline";

function Editor() {
    const { code, setCode, log } = useEditor();
    const editorRef = useRef<HTMLTextAreaElement>(null);

    const handleKeyDown = (e: KeyboardEvent): void => {
        if (e.key === "Tab") {
            e.preventDefault();
            const editor: HTMLTextAreaElement | null = editorRef.current;
            if (!editor) return;
            const start: number = editor.selectionStart;
            const end: number = editor.selectionEnd;
            setCode(code.slice(0, start) + "\t" + code.slice(end));
            setTimeout((): void => {
                editor.selectionStart = editor.selectionEnd = start + 1;
            }, 0);
        }
    };

    return (
        <div className="absolute w-1/2 h-7/10 left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="absolute inset-0 w-full h-full bg-gray-800/90 backdrop-blur-2xl rounded-xl" />

            <div className="relative w-full h-full p-8 flex flex-col rounded-xl">
                <div className="flex flex-row items-center justify-between mb-8 text-gray-500">
                    <h3>Code Editor</h3>
                    <a href="https://github.com/lokeig/aMazing-Solver.git" target="_blank" rel="noopener noreferrer">
                        <DocumentIcon className="w-5 h-5 hover:text-white cursor-pointer" />
                    </a>
                </div>
                <Textarea
                    ref={editorRef}
                    className="w-full h-9/10 whitespace-pre-wrap font-mono text-white resize-none focus:outline-none"
                    spellCheck={false}
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    onKeyDown={handleKeyDown}
                />
                <div className="w-full h-px bg-gray-500 my-2" />
                <Textarea
                    className="w-full h-1/10 font-mono text-red-400 resize-none focus:outline-none"
                    readOnly={true}
                    spellCheck={false}
                    value={log}
                    onChange={(e) => setCode(e.target.value)}
                    onKeyDown={handleKeyDown}
                />
            </div>
        </div>
    );
}

export default Editor;
