import { make_maze, verify_path } from "../../src/maze";
import { a_star } from "../../src/algorithms/a_star"

test("A* only forward", () => {
    const maze = make_maze([
        "S ###",
        "# ###",
        "#   #",
        "###E#",
    ])!;
    const path = a_star(maze);
    expect(verify_path(path, maze)).toBe(true);
});

test("A* no forks", () => {
    const maze = make_maze([
        "S    ",
        "#### ",
        "   # ",
        "E#   ",
    ])!;
    const path = a_star(maze);
    expect(verify_path(path, maze)).toBe(true);
});

test("A* full", () => {
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
    const path = a_star(maze);
    expect(verify_path(path, maze)).toBe(true);
});
