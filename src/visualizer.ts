import { Grid, Node } from "./components/Board.tsx";
import { Maze, MazeSolver, Cell, Action, LookupAction, MoveAction, Path, Pos, step_in_dir } from "./maze.ts";
import { getNodeID } from "./utils.ts";

function gridToMaze(grid: Grid): Maze {
    return {
        start: { x: grid.start.col, y: grid.start.row },
        end: { x: grid.end.col, y: grid.end.row },
        width: grid.nodes[0].length,
        height: grid.nodes.length,
        cells: grid.nodes.map((row: Node[]): Cell[] =>
            row.map((node: Node): Cell => (node.isWall ? "wall" : "empty"))
        ),
    };
}

export async function visualize(grid: Grid, solver: MazeSolver): Promise<void> {
    const maze: Maze = gridToMaze(grid);
    const actions: Path = solver(maze);

    const lookups: LookupAction[] = actions.filter((action: Action): action is LookupAction => action.type === "lookup");
    const moves: MoveAction[] = actions.filter((action: Action): action is MoveAction => action.type === "move");

    for (let i: number = 0; i < lookups.length; i++) {
        const action: LookupAction = lookups[i];
        await new Promise<void>((resolve): void => {
            setTimeout((): void => {
                const node: Node = grid.nodes[action.pos.y][action.pos.x];
                const cell: HTMLElement | null = document.getElementById(getNodeID(node.row, node.col));
                if (!node.isStart && !node.isEnd && !node.isWall) {
                    cell?.classList.add("search");
                }
                resolve();
            }, 10);
        });
    }

    let cur: Pos = { ...maze.start };
    for (let i: number = 0; i < moves.length; i++) {
        const action: MoveAction = moves[i];
        await new Promise<void>((resolve): void => {
            setTimeout((): void => {
                cur = step_in_dir(cur, action.dir);
                const node: Node = grid.nodes[cur.y][cur.x];
                const cell: HTMLElement | null = document.getElementById(getNodeID(node.row, node.col));
                cell?.classList.add("path");
                resolve();
            }, 10);
        });
    }
}
