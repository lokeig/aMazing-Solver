import Board from "./components/Board";
import Header from "./components/Header.tsx";
import { GridProvider } from "./components/GridContext.tsx";

function App() {
    return (
        <div className="app">
            <GridProvider>
                <Header />
                <Board />
            </GridProvider>
        </div>
    );
}

export default App;
