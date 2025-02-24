import { make_maze, verify_path } from "../src/maze";
import { A_Star } from "../src/a_star"

test("A* only forward", () => {
    const maze = make_maze([
        "S ###",
        "# ###",
        "#   #",
        "###E#",
    ])!;
    const path = A_Star(maze);
    expect(verify_path(path, maze)).toBe(true);
});

test("A* no forks", () => {
    const maze = make_maze([
        "S    ",
        "#### ",
        "   # ",
        "E#   ",
    ])!;
    const path = A_Star(maze);
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
    const path = A_Star(maze);
    expect(verify_path(path, maze)).toBe(true);
});
