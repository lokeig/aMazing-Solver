import { evaluate, make_rval_arr } from "../../src/interpreter/evaluator";
import { make_int } from "../../src/interpreter/ir";

test("most simple", () => {
    const [main, stdout] = evaluate("var main = fn () {};");
    const output = main();
    expect(output).toStrictEqual(make_int(0));
    expect(stdout).toStrictEqual([]);
});

test("print and return", () => {
    const [main, stdout] = evaluate(`
        var main = fn () {
            print(1);
            return 2;
        };
    `);
    const output = main();
    expect(output).toStrictEqual(make_int(2));
    expect(stdout).toStrictEqual(["1"]);
});

test("arguments", () => {
    const [main, stdout] = evaluate(`
        var main = fn (x, y) {
            print(x + y);
            return x - y;
        };
    `);
    const output = main(make_int(3), make_int(5));
    expect(output).toStrictEqual(make_int(-2));
    expect(stdout).toStrictEqual(["8"]);
});

test("local function", () => {
    const [main, stdout] = evaluate(`
        var f = fn (x) {
            print(x);
            return x * x;
        };

        var main = fn (x, y) {
            print(f(x));
            return f(y);
        };
    `);
    const output = main(make_int(3), make_int(5));
    expect(output).toStrictEqual(make_int(25));
    expect(stdout).toStrictEqual(["3", "9", "5"]);
});

test("arrays", () => {
    const [main, stdout] = evaluate(`
        var a = [1, 2, 3];
        a[0] = 4;
        print(a);

        var main = fn () {
            return a[0];
        };
    `);
    const output = main();
    expect(output).toStrictEqual(make_int(4));
    expect(stdout).toStrictEqual(["[4, 2, 3]"]);
});

test("len push pop", () => {
    const [main, stdout] = evaluate(`
        var a = [1, 2, 3];
        print(len(a));
        push(a, 0);
        print(len(a));
        print(pop(a));
        print(pop(a));
        print(len(a));

        var main = fn () {
            return a;
        };
    `);
    const output = main();
    expect(output).toStrictEqual(make_rval_arr([
        make_int(1),
        make_int(2)
    ]));
    expect(stdout).toStrictEqual([
        "3",
        "4",
        "0",
        "3",
        "2"
    ]);
});

test("if else", () => {
    const [main, stdout] = evaluate(`
        if ([]) {
            print(false);
        } else {
            print(true);
        }

        if (true) print([]);

        var main = fn () {};

        if (main) print(main);
    `);
    const output = main();
    expect(output).toStrictEqual(make_int(0));
    expect(stdout).toStrictEqual(["1", "[]", "fn () { ... }"]);
});

test("while", () => {
    const [main, stdout] = evaluate(`
        var i = 0;
        while (i < 10) {
            i = i + 1;
            if (i == 2) continue;
            print(i);
            if (i == 4) break;
        }

        var main = fn () {};

        while (false) print(false);
        while (true) return;
    `);
    const output = main();
    expect(output).toStrictEqual(make_int(0));
    expect(stdout).toStrictEqual(["1", "3", "4"]);
});

test("logical operators", () => {
    const [main, stdout] = evaluate(`
        var f = fn () { print([]); };

        print(2 || f());
        print(0 || f());
        print(2 && f());
        print(0 && f());
        print(2 == f);
        print(2 == 2);
        print(f == f);
        print(2 != f);
        print(2 != 2);

        var main = fn () {};
    `);
    const output = main();
    expect(output).toStrictEqual(make_int(0));
    expect(stdout).toStrictEqual([
        "2",
        "[]", "0",
        "[]", "0",
        "0",
        "0",
        "1",
        "1",
        "1",
        "0"
    ]);
});

test("comparison operators", () => {
    const [main, stdout] = evaluate(`
        print(-1 < 0);
        print(0 < 0);
        print(-3 > 2);
        print(-3 > -4);
        print(2 >= 2);
        print(3 <= 2);

        var main = fn () {};
    `);
    const output = main();
    expect(output).toStrictEqual(make_int(0));
    expect(stdout).toStrictEqual([
        "1",
        "0",
        "0",
        "1",
        "1",
        "0"
    ]);
});

test("arithmetic operators", () => {
    const [main, stdout] = evaluate(`
        print(!3);
        print(!0);
        print(+-4);
        print(1 + 1);
        print(2 + -4);
        print(4 - 1);
        print(1 - 4);
        print(0 * 1000);
        print(4 * 6);
        print(8 / 4);
        print(5 / 2);
        print(-5 / 2);
        print(5 / -2);
        print(-5 / -2);
        print(2 % 3);
        print(7 % 3);
        print(-7 % 3);
        print(7 % -3);
        print(-7 % -3);
        print([1, 2, 3] + [4, 5, 6]);

        var main = fn () {};
    `);
    const output = main();
    expect(output).toStrictEqual(make_int(0));
    expect(stdout).toStrictEqual([
        "0",
        "1",
        "-4",
        "2",
        "-2",
        "3",
        "-3",
        "0",
        "24",
        "2",
        "2",
        "-3",
        "-3",
        "2",
        "2",
        "1",
        "2",
        "-2",
        "-1",
        "[1, 2, 3, 4, 5, 6]"
    ]);
});

test("operator type error", () => {
    expect(() => evaluate("+[];")).toThrow(TypeError);
    expect(() => evaluate("-[];")).toThrow(TypeError);
    expect(() => evaluate("1 + [];")).toThrow(TypeError);
    expect(() => evaluate("1 - [];")).toThrow(TypeError);
    expect(() => evaluate("1 * [];")).toThrow(TypeError);
    expect(() => evaluate("1 / [];")).toThrow(TypeError);
    expect(() => evaluate("1 % [];")).toThrow(TypeError);
    expect(() => evaluate("1 < [];")).toThrow(TypeError);
    expect(() => evaluate("1 > [];")).toThrow(TypeError);
    expect(() => evaluate("1 <= [];")).toThrow(TypeError);
    expect(() => evaluate("1 >= [];")).toThrow(TypeError);
    expect(() => evaluate("0 / 0;")).toThrow(RangeError);
});

test("other type errors", () => {
    expect(() => evaluate("1();")).toThrow(TypeError);
    expect(() => evaluate("1[0];")).toThrow(TypeError);
    expect(() => evaluate("[][[]];")).toThrow(TypeError);
    expect(() => evaluate("1 = 2;")).toThrow(TypeError);
});

test("array out of bounds error", () => {
    expect(() => evaluate("[][0];")).toThrow(RangeError);
    expect(() => evaluate("[1, 2][-1];")).toThrow(RangeError);
    expect(() => evaluate("[1, 2][2];")).toThrow(RangeError);
    expect(() => evaluate("var x = [1]; x[0] = fn () { return pop(x); }();")).toThrow(RangeError);
});

test("wrong number of parameters error", () => {
    expect(() => evaluate("fn(){}(0);")).toThrow(TypeError);
    expect(() => evaluate("fn(x){}();")).toThrow(TypeError);
    expect(() => evaluate("pop();")).toThrow(TypeError);
    expect(() => evaluate("pop(1, 2, 3);")).toThrow(TypeError);
});

test("builtin errors", () => {
    expect(() => evaluate("len(1);")).toThrow(TypeError);
    expect(() => evaluate("push(1, 1);")).toThrow(TypeError);
    expect(() => evaluate("pop(1);")).toThrow(TypeError);
    expect(() => evaluate("panic();")).toThrow(Error);
});

test("name error", () => {
    expect(() => evaluate(";")).toThrow(ReferenceError);
    expect(() => evaluate("x; var main = fn(){};")).toThrow(ReferenceError);
    expect(() => evaluate("x = 1; var main = fn(){};")).toThrow(ReferenceError);
    expect(() => evaluate("var x = 1; var x = 2;")).toThrow(ReferenceError);
    expect(() => evaluate("var main = 1;")).toThrow(TypeError);
});
