import { type Token, TokenType, make_token, token_err_name, tokenize } from "../../src/interpreter/tokenizer";

test("empty", () => {
    const str: string = "";
    const expected: Token[] = [
        make_token(TokenType.EOF, "", 1, 1)
    ];
    expect(tokenize(str)).toStrictEqual(expected);
});

test("keywords", () => {
    const str: string = "var fn if else while\nreturn continue break";
    const expected: Token[] = [
        make_token(TokenType.VAR, "var", 1, 1),
        make_token(TokenType.FN, "fn", 1, 5),
        make_token(TokenType.IF, "if", 1, 8),
        make_token(TokenType.ELSE, "else", 1, 11),
        make_token(TokenType.WHILE, "while", 1, 16),
        make_token(TokenType.RETURN, "return", 2, 1),
        make_token(TokenType.CONTINUE, "continue", 2, 8),
        make_token(TokenType.BREAK, "break", 2, 17),
        make_token(TokenType.EOF, "", 2, 22),
    ];
    expect(tokenize(str)).toStrictEqual(expected);
});

test("more spacing", () => {
    const str: string = " \tif\t if\t \n if\t";
    const expected: Token[] = [
        make_token(TokenType.IF, "if", 1, 5),
        make_token(TokenType.IF, "if", 1, 10),
        make_token(TokenType.IF, "if", 2, 2),
        make_token(TokenType.EOF, "", 2, 5),
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

        make_token(TokenType.EOF, "", 8, 6),
    ];
    expect(tokenize(str)).toStrictEqual(expected);
});

test("symbols", () => {
    const str: string = "( ) { } [ ] < > = == != <= >= && || ! + - * / % , ;"
    const expected: Token[] = [
        make_token(TokenType.LPAREN, "(", 1, 1),
        make_token(TokenType.RPAREN, ")", 1, 3),
        make_token(TokenType.LBRACKET, "{", 1, 5),
        make_token(TokenType.RBRACKET, "}", 1, 7),
        make_token(TokenType.LSQUARE, "[", 1, 9),
        make_token(TokenType.RSQUARE, "]", 1, 11),
        make_token(TokenType.LANGLE, "<", 1, 13),
        make_token(TokenType.RANGLE, ">", 1, 15),
        make_token(TokenType.EQ, "=", 1, 17),
        make_token(TokenType.EQEQ, "==", 1, 19),
        make_token(TokenType.NEQ, "!=", 1, 22),
        make_token(TokenType.LEQ, "<=", 1, 25),
        make_token(TokenType.GEQ, ">=", 1, 28),
        make_token(TokenType.ANDAND, "&&", 1, 31),
        make_token(TokenType.OROR, "||", 1, 34),
        make_token(TokenType.EXLAMATION, "!", 1, 37),
        make_token(TokenType.PLUS, "+", 1, 39),
        make_token(TokenType.MINUS, "-", 1, 41),
        make_token(TokenType.STAR, "*", 1, 43),
        make_token(TokenType.SLASH, "/", 1, 45),
        make_token(TokenType.PERCENT, "%", 1, 47),
        make_token(TokenType.COMMA, ",", 1, 49),
        make_token(TokenType.SEMICOLON, ";", 1, 51),
        make_token(TokenType.EOF, "", 1, 52),
    ];
    expect(tokenize(str)).toStrictEqual(expected);
});

test("adjacent symbols", () => {
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
        make_token(TokenType.EOF, "", 1, 15),
    ];
    expect(tokenize(str)).toStrictEqual(expected);
});

test("comments", () => {
    const str: string = "#?test?\n+ # ?test?";
    const expected: Token[] = [
        make_token(TokenType.PLUS, "+", 2, 1),
        make_token(TokenType.EOF, "", 2, 11),
    ];
    expect(tokenize(str)).toStrictEqual(expected);
})

test("unrecognized", () => {
    expect(() => tokenize("?")).toThrow(SyntaxError);
});

test("error names", () => {
    Object.values(TokenType)
        .filter(t => typeof t === "number")
        .forEach(t => expect(typeof token_err_name(t)).toBe("string"));
});
