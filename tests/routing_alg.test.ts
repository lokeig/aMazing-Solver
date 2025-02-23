import { make_maze, verify_path } from "../src/maze";
import { maze_routing_alg } from "../src/routing_alg"

test("routing alg only forward", () => {
    const maze = make_maze([
        "S ###",
        "# ###",
        "#   #",
        "###E#",
    ])!;
    const path = maze_routing_alg(maze);
    expect(verify_path(path, maze)).toBe(true);
});

test("routing alg no forks", () => {
    const maze = make_maze([
        "S    ",
        "#### ",
        "   # ",
        "E#   ",
    ])!;
    const path = maze_routing_alg(maze);
    expect(verify_path(path, maze)).toBe(true);
});

test("routing alg full", () => {
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
    const path = maze_routing_alg(maze);
    expect(verify_path(path, maze)).toBe(true);
});

test("routing alg unsolvable", () => {

    const maze = make_maze([
        "S ",
        "##",
        "E ",
    ])!;
    const path = maze_routing_alg(maze);
    expect(path).toStrictEqual([]);
});