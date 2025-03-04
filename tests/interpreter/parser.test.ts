import { tokenize } from "../../src/interpreter/tokenizer";
import { parse } from "../../src/interpreter/parser";
import { Block, make_access, make_arr, make_assignment, make_binary, make_block, make_break, make_call, make_continue, make_decl, make_for, make_if_else, make_int, make_lambda, make_nop, make_return, make_unary, make_var, make_while } from "../../src/interpreter/ir";

test("empty", () => {
    const str: string = "";
    const expected: Block = make_block([]);
    expect(parse(tokenize(str))).toStrictEqual(expected);
});

test("nop", () => {
    const str: string = ";";
    const expected: Block = make_block([make_nop()]);
    expect(parse(tokenize(str))).toStrictEqual(expected);
});

test("expression", () => {
    const str: string = "3 * -1 + 2 % (18 / 2) * 5;";
    const expected: Block = make_block([
        make_binary(
            "+",
            make_binary(
                "*",
                make_int(3),
                make_unary("-", make_int(1))
            ),
            make_binary(
                "*",
                make_binary(
                    "%",
                    make_int(2),
                    make_binary(
                        "/",
                        make_int(18),
                        make_int(2)
                    )
                ),
                make_int(5)
            )
        )
    ]);
    expect(parse(tokenize(str))).toStrictEqual(expected);
});

test("different bases in integer", () => {
    const str: string = "123;12___3;0xf_E8;0b10_10;";
    const expected: Block = make_block([
        make_int(123),
        make_int(123),
        make_int(4072),
        make_int(10)
    ]);
    expect(parse(tokenize(str))).toStrictEqual(expected);
});

test("declaration, assignment and functions", () => {
    const str: string = `
        var x = 10;
        x = 20;
        var f = fn (a, b, c) { return a + b + c; };
        f(1, x, 3);
    `;
    const expected: Block = make_block([
        make_decl("x", make_int(10)),
        make_assignment(make_var("x"), make_int(20)),
        make_decl(
            "f",
            make_lambda(
                [
                    make_var("a"),
                    make_var("b"),
                    make_var("c")
                ],
                make_block([
                    make_return(
                        make_binary(
                            "+",
                            make_binary(
                                "+",
                                make_var("a"),
                                make_var("b"),
                            ),
                            make_var("c")
                        )
                    )
                ])
            )
        ),
        make_call(
            make_var("f"),
            [
                make_int(1),
                make_var("x"),
                make_int(3)
            ]
        )
    ]);
    expect(parse(tokenize(str))).toStrictEqual(expected);
});

test("if and while", () => {
    const str: string = `
        var x = 0;
        if (1 == 1) x = 3;

        while (x > 0) {
            if (x < 2) {
                break;
            } else {
                x = x - 1;
                continue;
            }
        }
    `;
    const expected: Block = make_block([
        make_decl("x", make_int(0)),
        make_if_else(
            make_binary(
                "==",
                make_int(1),
                make_int(1),
            ),
            make_assignment(make_var("x"), make_int(3)),
            null
        ),
        make_while(
            make_binary(
                ">",
                make_var("x"),
                make_int(0),
            ),
            make_block([
                make_if_else(
                    make_binary(
                        "<",
                        make_var("x"),
                        make_int(2)
                    ),
                    make_block([
                        make_break()
                    ]),
                    make_block([
                        make_assignment(
                            make_var("x"),
                            make_binary(
                                "-",
                                make_var("x"),
                                make_int(1)
                            )
                        ),
                        make_continue()
                    ])
                )
            ])
        )
    ]);
    expect(parse(tokenize(str))).toStrictEqual(expected);
});

test("for", () => {

    const str: string = `
        for (0; 0; 0);
        for (x = 0; x < 10; x = x + 1);
        for (var x = [0]; x; f(x)) {}
    `;
    const expected: Block = make_block([
        make_for(
            make_int(0),
            make_int(0),
            make_int(0),
            make_nop()
        ),
        make_for(
            make_assignment(
                make_var("x"),
                make_int(0)
            ),
            make_binary(
                "<",
                make_var("x"),
                make_int(10)
            ),
            make_assignment(
                make_var("x"),
                make_binary(
                    "+",
                    make_var("x"),
                    make_int(1),
                )
            ),
            make_nop()
        ),
        make_for(
            make_decl(
                "x",
                make_arr([make_int(0)])
            ),
            make_var("x"),
            make_call(
                make_var("f"),
                [make_var("x")]
            ),
            make_block([])
        )
    ]);
    expect(parse(tokenize(str))).toStrictEqual(expected);
});

test("arrays", () => {
    const str: string = `
        var arr = [ 1, 2, 3 ];
        arr[0];
        arr[1] = 4;

        arr = [ 1, fn () { return; }, arr ];
        arr[1]();
        arr[2][1];
    `;
    const expected: Block = make_block([
        make_decl(
            "arr",
            make_arr([
                make_int(1),
                make_int(2),
                make_int(3),
            ])
        ),
        make_access(
            make_var("arr"),
            make_int(0)
        ),
        make_assignment(
            make_access(
                make_var("arr"),
                make_int(1)
            ),
            make_int(4)
        ),
        make_assignment(
            make_var("arr"),
            make_arr([
                make_int(1),
                make_lambda(
                    [],
                    make_block([
                        make_return(null)
                    ])
                ),
                make_var("arr")
            ])
        ),
        make_call(
            make_access(
                make_var("arr"),
                make_int(1),
            ),
            []
        ),
        make_access(
            make_access(
                make_var("arr"),
                make_int(2),
            ),
            make_int(1)
        )
    ]);
    expect(parse(tokenize(str))).toStrictEqual(expected);
});

test("all operators", () => {
    const str: string = "0||0;0&&0;0==0;0!=0;0<0;0>0;0<=0;0>=0;0+0;0-0;0*0;0/0;0%0;!0;+0;-0;";
    const expected: Block = make_block([
        make_binary("||", make_int(0), make_int(0)),
        make_binary("&&", make_int(0), make_int(0)),
        make_binary("==", make_int(0), make_int(0)),
        make_binary("!=", make_int(0), make_int(0)),
        make_binary("<", make_int(0), make_int(0)),
        make_binary(">", make_int(0), make_int(0)),
        make_binary("<=", make_int(0), make_int(0)),
        make_binary(">=", make_int(0), make_int(0)),
        make_binary("+", make_int(0), make_int(0)),
        make_binary("-", make_int(0), make_int(0)),
        make_binary("*", make_int(0), make_int(0)),
        make_binary("/", make_int(0), make_int(0)),
        make_binary("%", make_int(0), make_int(0)),
        make_unary("!", make_int(0)),
        make_unary("+", make_int(0)),
        make_unary("-", make_int(0))
    ]);
    expect(parse(tokenize(str))).toStrictEqual(expected);
});

test("unexpected token error", () => {
    expect(() => parse(tokenize("var ;"))).toThrow(SyntaxError);
    expect(() => parse(tokenize("var x = y[2] var;"))).toThrow(SyntaxError);
    expect(() => parse(tokenize("var x = 1 )"))).toThrow(SyntaxError);
    expect(() => parse(tokenize("var x = 1 + ("))).toThrow(SyntaxError);
    expect(() => parse(tokenize("var x = 1 + var"))).toThrow(SyntaxError);
    expect(() => parse(tokenize("[1, 2, 3,];"))).toThrow(SyntaxError);
    expect(() => parse([])).toThrow(SyntaxError);
});

test("invalid integers", () => {
    expect(() => parse(tokenize("0x;"))).toThrow(SyntaxError);
    expect(() => parse(tokenize("0b;"))).toThrow(SyntaxError);
    expect(() => parse(tokenize("0x_;"))).toThrow(SyntaxError);
    expect(() => parse(tokenize("0b_____;"))).toThrow(SyntaxError);
    expect(() => parse(tokenize("0ff;"))).toThrow(SyntaxError);
    expect(() => parse(tokenize("0b12;"))).toThrow(SyntaxError);
    expect(() => parse(tokenize("0xh;"))).toThrow(SyntaxError);
});
