import { join_paths, lookup_action, make_maze, make_path, make_pos, verify_path } from "../src/maze";

test("verify valid move", () => {
    const maze = make_maze([
        "S ",
        "# ",
        "E ",
    ])!;
    const path = make_path("DSSA")!;
    expect(verify_path(path, maze)).toBe(true);
});

test("verify invalid move", () => {
    const maze = make_maze([
        "S ",
        "# ",
        "E ",
    ])!;
    const path = make_path("SS")!;
    expect(verify_path(path, maze)).toBe(false);
})

test("verify valid lookup", () => {
    const maze = make_maze([
        "S ",
        "# ",
        "E ",
    ])!;
    const path = join_paths([
        lookup_action(make_pos(0, 0)),
        lookup_action(make_pos(0, 1)),
        lookup_action(make_pos(1, 2)),
    ], make_path("DSSA")!);
    expect(verify_path(path, maze)).toBe(true);
})

test("verify invalid lookup", () => {
    const maze = make_maze([
        "S ",
        "# ",
        "E ",
    ])!;
    const path = join_paths([
        lookup_action(make_pos(0, 0)),
        lookup_action(make_pos(2, 1)),
        lookup_action(make_pos(1, 2)),
    ], make_path("DSSA")!);
    expect(verify_path(path, maze)).toBe(false);
})

