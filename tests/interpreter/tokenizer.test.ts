import { type Token, TokenType, make_token, tokenize } from "../../src/interpreter/tokenizer";

test("empty", () => {
    const str: string = "";
    const expected: Token[] = [];
    expect(tokenize(str)).toStrictEqual(expected);
});

test("keywords", () => {
    const str: string = "var if else while\nreturn continue break";
    const expected: Token[] = [
        make_token(TokenType.VAR, "var", 1, 1),
        make_token(TokenType.IF, "if", 1, 5),
        make_token(TokenType.ELSE, "else", 1, 8),
        make_token(TokenType.WHILE, "while", 1, 13),
        make_token(TokenType.RETURN, "return", 2, 1),
        make_token(TokenType.CONTINUE, "continue", 2, 8),
        make_token(TokenType.BREAK, "break", 2, 17),
    ];
    expect(tokenize(str)).toStrictEqual(expected);
});

test("more spacing", () => {
    const str: string = " \tif\t if\t \n if\t";
    const expected: Token[] = [
        make_token(TokenType.IF, "if", 1, 5),
        make_token(TokenType.IF, "if", 1, 10),
        make_token(TokenType.IF, "if", 2, 2),
    ];
    expect(tokenize(str)).toStrictEqual(expected);
});

test("integers and names", () => {
    const str: string = "1 \n 100_000 \n 0xF2f \n 10za \n test \n _test_ \n _1 \n x123";
    const expected: Token[] = [
        make_token(TokenType.INT, "1", 1, 1),
        make_token(TokenType.INT, "100_000", 2, 2),
        make_token(TokenType.INT, "0xF2f", 3, 2),
        make_token(TokenType.INT, "10za", 4, 2),

        make_token(TokenType.NAME, "test", 5, 2),
        make_token(TokenType.NAME, "_test_", 6, 2),
        make_token(TokenType.NAME, "_1", 7, 2),
        make_token(TokenType.NAME, "x123", 8, 2),
    ];
    expect(tokenize(str)).toStrictEqual(expected);
});

test("symbols", () => {
    const str: string = "+-<=== >=> ===";
    const expected: Token[] = [
        make_token(TokenType.PLUS, "+", 1, 1),
        make_token(TokenType.MINUS, "-", 1, 2),
        make_token(TokenType.LEQ, "<=", 1, 3),
        make_token(TokenType.EQEQ, "==", 1, 5),
        make_token(TokenType.GEQ, ">=", 1, 8),
        make_token(TokenType.RANGLE, ">", 1, 10),
        make_token(TokenType.EQEQ, "==", 1, 12),
        make_token(TokenType.EQ, "=", 1, 14),
    ];
    expect(tokenize(str)).toStrictEqual(expected);
});
