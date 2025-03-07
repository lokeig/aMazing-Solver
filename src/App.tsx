import { JSX } from "react";
import { Board } from "./components/Board.tsx";
import { Header } from "./components/Header.tsx";
import { GridProvider } from "./components/GridContext.tsx";
import { EditorProvider } from "./components/EditorContext.tsx";

function App(): JSX.Element {
    return (
        <div className="app">
            <GridProvider>
                <EditorProvider>
                    <Header />
                </EditorProvider>
                <Board />
            </GridProvider>
        </div>
    );
}

export default App;
