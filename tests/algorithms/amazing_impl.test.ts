import { make_maze, verify_path } from "../../src/maze";
import { evaluate_solver } from "../../src/interpreter/evaluator";
import { amazing_a_star, amazing_dijkstra, amazing_routing_alg } from "../../src/algorithms/amazing_impl";

const a_star = evaluate_solver(amazing_a_star)[0];
const dijkstra = evaluate_solver(amazing_dijkstra)[0];
const routing_alg = evaluate_solver(amazing_routing_alg)[0];

const algorithms = [a_star, dijkstra, routing_alg];

test("amazing impls only forward", () => {
    const maze = make_maze([
        "S ###",
        "# ###",
        "#   #",
        "###E#",
    ])!;
    for (const alg of algorithms) {
        const path = alg(maze);
        expect(verify_path(path, maze)).toBe(true);
    }
});

test("amazing impls no forks", () => {
    const maze = make_maze([
        "S    ",
        "#### ",
        "   # ",
        "E#   ",
    ])!;
    for (const alg of algorithms) {
        const path = alg(maze);
        expect(verify_path(path, maze)).toBe(true);
    }
});

test("amazing impls full", () => {
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
    for (const alg of algorithms) {
        const path = alg(maze);
        expect(verify_path(path, maze)).toBe(true);
    }
});
