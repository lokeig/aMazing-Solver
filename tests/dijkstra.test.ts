import { make_maze, verify_path } from "../src/maze";
import { dijkstra } from "../src/algorithms/dijkstra"

test("Dijkstra only forward", () => {
    const maze = make_maze([
        "S ###",
        "# ###",
        "#   #",
        "###E#",
    ])!;
    const path = dijkstra(maze);
    expect(verify_path(path, maze)).toBe(true);
});

test("Dijkstra no forks", () => {
    const maze = make_maze([
        "S    ",
        "#### ",
        "   # ",
        "E#   ",
    ])!;
    const path = dijkstra(maze);
    expect(verify_path(path, maze)).toBe(true);
});

test("Dijkstra full", () => {
    const maze = make_maze([
        "## #### ##",
        "#S       #",
        "## #### ##",
        "#  #      ",
        "#  ## ####",
        "####     #",
        "#E# #### #",
        "# #   ## #",
        "#   #    #",
    ])!;
    const path = dijkstra(maze);
    expect(verify_path(path, maze)).toBe(true);
});
