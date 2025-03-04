import { make_maze, verify_path } from "../../src/maze";
import { dfs } from "../../src/algorithms/dfs"

test("dfs only forward", () => {
    const maze = make_maze([
        "S ###",
        "# ###",
        "#   #",
        "###E#",
    ])!;
    const path = dfs(maze);
    expect(verify_path(path, maze)).toBe(true);
});

test("dfs no forks", () => {
    const maze = make_maze([
        "S    ",
        "#### ",
        "   # ",
        "E#   ",
    ])!;
    const path = dfs(maze);
    expect(verify_path(path, maze)).toBe(true);
});

test("dfs full", () => {
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
    const path = dfs(maze);
    expect(verify_path(path, maze)).toBe(true);
});
