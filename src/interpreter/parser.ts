import { type Decl, type Block, type Expr, type Int, make_decl, make_var, make_int, make_arr, make_unary, make_call, make_access, Stmt, make_lambda, make_binary, Asgmt, make_assignment, make_if_else, IfElse, While, make_while, Return, make_return, make_nop, make_continue, make_break, make_block } from "./ir";
import { token_err_name, TokenType, type Token } from "./tokenizer";

type StackOp = () => Token;

function operator_precedence(symbol: string): number {
    switch (symbol) {
        case "||": return 1;
        case "&&": return 2;
        case "==":
        case "!=": return 3;
        case "<":
        case ">":
        case "<=":
        case ">=": return 4;
        case "+":
        case "-": return 5;
        case "*":
        case "/":
        case "%": return 6;

        default: throw new SyntaxError(`Invalid operator '${symbol}'.`);
    }
}

function unexpected(token: Token): never {
    throw new SyntaxError(`Unexpected ${token_err_name(token.type)} at line ${token.ln}, column ${token.col}.`);
}
function expect_type(type: TokenType, token: Token): Token {
    if (token.type === type) {
        return token;
    } else {
        throw new SyntaxError(
            `Expected ${token_err_name(type)} but got ${token_err_name(token.type)} at line ${token.ln}, column ${token.col}.`
        );
    }
}

function char_val_in_base(char: string, base: number): number | null {
    let val;
    if (char >= "0" && char <= "9") {
        val = char.charCodeAt(0) - "0".charCodeAt(0);
    } else if (char >= "a" && char <= "z") {
        val = 10 + char.charCodeAt(0) - "a".charCodeAt(0);
    } else if (char >= "A" && char <= "Z") {
        val = 10 + char.charCodeAt(0) - "A".charCodeAt(0);
    } else {
        return null;
    }

    if (val < base) {
        return val;
    } else {
        return null;
    }
}
function parse_int(token: Token): Int {
    const str = token.str;
    let i = 0;
    let base = 10;
    if (str.startsWith("0x") || str.startsWith("0X")) {
        i = 2;
        base = 16;
    } else if (str.startsWith("0b") || str.startsWith("0B")) {
        i = 2;
        base = 2;
    }

    let val: number | null = null;
    while (i < str.length) {
        const char = str[i++];
        if (char === "_") continue;

        const char_val = char_val_in_base(char, base);
        if (char_val === null) {
            throw new SyntaxError(
                `Invalid digit '${char}' in base ${base} integer literal at line ${token.ln}, column ${token.col}.`
            );
        } else if (val === null) {
            val = char_val;
        } else {
            val = val * base + char_val;
        }
    }

    if (val === null) {
        throw new SyntaxError(`Invlaid integer literal at line ${token.ln}, column ${token.col}.`);
    }

    return make_int(val);
}

function parse_list<T>(
    peek: StackOp, consume: StackOp,
    delim: TokenType[], end: TokenType[],
    elem_parser: (peek: StackOp, consume: StackOp) => T
): T[] {
    const list: T[] = [];

    if (end.includes(peek().type)) return list; // empty list
    while (true) {
        list.push(elem_parser(peek, consume)); // parse next elem

        const t = peek();
        if (end.includes(t.type)) return list; // end of list
        else if (delim.includes(t.type)) consume(); // consume delimiter and continue
        else unexpected(t);
    }
}

function parse_unary(peek: StackOp, consume: StackOp, operand: Expr): Expr {
    const t = peek();

    let res: Expr;
    switch (t.type) {
        case TokenType.LPAREN:
            consume();
            const args = parse_list(
                peek, consume,
                [TokenType.COMMA], [TokenType.RPAREN],
                (peek, consume) => parse_expr(peek, consume, [TokenType.COMMA, TokenType.RPAREN])
            );
            expect_type(TokenType.RPAREN, consume());
            res = make_call(operand, args);
            break;
        case TokenType.LSQUARE:
            consume();
            const i = parse_expr(peek, consume, [TokenType.RSQUARE]);
            expect_type(TokenType.RSQUARE, consume());
            res = make_access(operand, i);
            break;

        default: return operand; // no postfix
    }

    // recursive to allow stacked postfix
    return parse_unary(peek, consume, res);
}
function parse_term(peek: StackOp, consume: StackOp): Expr {
    const t = consume();

    let res: Expr;
    switch (t.type) {
        case TokenType.NAME:
            res = make_var(t.str);
            break;
        case TokenType.INT:
            res = parse_int(t);
            break

        case TokenType.FN:
            // fn ( x, y, z ) { ... }
            expect_type(TokenType.LPAREN, consume());
            const params = parse_list(
                peek, consume,
                [TokenType.COMMA], [TokenType.RPAREN],
                (_, consume) => make_var(expect_type(TokenType.NAME, consume()).str)
            );
            expect_type(TokenType.RPAREN, consume());
            expect_type(TokenType.LBRACKET, consume());
            const body = parse_block(peek, consume, [TokenType.RBRACKET]);
            expect_type(TokenType.RBRACKET, consume());
            res = make_lambda(params, body);
            break;

        case TokenType.LPAREN: // regular parenthesis grouping
            res = parse_expr(peek, consume, [TokenType.RPAREN]);
            expect_type(TokenType.RPAREN, consume());
            break;
        case TokenType.LSQUARE: // array literal
            res = make_arr(parse_list(
                peek, consume,
                [TokenType.COMMA], [TokenType.RSQUARE],
                (peek, consume) => parse_expr(peek, consume, [TokenType.COMMA, TokenType.RSQUARE])
            ));
            expect_type(TokenType.RSQUARE, consume());
            break;

        case TokenType.EXLAMATION:
        case TokenType.PLUS:
        case TokenType.MINUS:
            // recursive to allow stacked prefix
            res = make_unary(t.str, parse_term(peek, consume));
            break;

        default: unexpected(t);
    }

    // grab postfix
    return parse_unary(peek, consume, res);
}
function parse_expr(peek: StackOp, consume: StackOp, end: TokenType[]): Expr {
    type Value = { tag: "value", val: Expr };
    type Operator = { tag: "operator", token: Token, symbol: string, precedence: number };
    type LParen = { tag: "left", token: Token };
    type RParen = { tag: "right", token: Token };

    function make_value(val: Expr): Value {
        return { tag: "value", val };
    }
    function make_operator(token: Token): Operator {
        return { tag: "operator", token, symbol: token.str, precedence: operator_precedence(token.str) };
    }
    function make_lparen(token: Token): LParen {
        return { tag: "left", token };
    }
    function make_rparen(token: Token): RParen {
        return { tag: "right", token };
    }

    const input: (Value | Operator | LParen | RParen)[] = [
        make_value(parse_term(peek, consume))
    ];

    while (!end.includes(peek().type)) {
        const t = consume();
        switch (t.type) {
            case TokenType.LPAREN:
                input.push(make_lparen(t));
                break;
            case TokenType.RPAREN:
                input.push(make_rparen(t));
                break;
            case TokenType.LANGLE:
            case TokenType.RANGLE:
            case TokenType.EQEQ:
            case TokenType.NEQ:
            case TokenType.LEQ:
            case TokenType.GEQ:
            case TokenType.ANDAND:
            case TokenType.OROR:
            case TokenType.PLUS:
            case TokenType.MINUS:
            case TokenType.STAR:
            case TokenType.SLASH:
            case TokenType.PERCENT:
                input.push(make_operator(t));
                break;

            default: unexpected(t);
        }
        input.push(make_value(parse_term(peek, consume)));
    }

    const output: (Value | Operator)[] = []
    const operator: (Operator | LParen)[] = []

    // shunting yard algorithm
    for (const t of input) {
        switch (t.tag) {
            case "value":
                output.push(t);
                break;
            case "operator":
                while (true) {
                    const top = operator.at(-1);
                    if (top === undefined || top.tag === "left") break;
                    if (top.precedence < t.precedence) break;
                    operator.pop();
                    output.push(top);
                }
                operator.push(t);
                break;
            case "left":
                operator.push(t);
                break;
            case "right":
                while (true) {
                    const top = operator.pop();
                    if (top === undefined) unexpected(t.token); // mismatched parenthesis
                    else if (top.tag === "left") break;
                    else output.push(top);
                }
        }
    }
    while (true) {
        const top = operator.pop();
        if (top === undefined) break;
        else if (top.tag === "left") unexpected(top.token) // mismatched parenthesis
        else output.push(top);
    }
    // end of shunting yard

    const stack: Expr[] = [];
    for (const t of output) {
        if (t.tag === "value") {
            stack.push(t.val);
        } else {
            const right = stack.pop();
            const left = stack.pop();
            if (right === undefined || left === undefined) unexpected(t.token) // not sure if this can occur
            stack.push(make_binary(t.symbol, left, right));
        }
    }
    if (stack.length !== 1) throw new SyntaxError("Invalid Expression."); // not sure if this can occur
    return stack[0];
}

function parse_decl(peek: StackOp, consume: StackOp): Decl {
    // var name = ... ;
    expect_type(TokenType.VAR, consume());
    const name = expect_type(TokenType.NAME, consume()).str;
    expect_type(TokenType.EQ, consume());
    const expr = parse_expr(peek, consume, [TokenType.SEMICOLON]);
    expect_type(TokenType.SEMICOLON, consume());
    return make_decl(name, expr);
}
function parse_expr_stmt(peek: StackOp, consume: StackOp): Asgmt | Expr {
    // expr ;
    // expr = ... ;
    const left = parse_expr(peek, consume, [TokenType.SEMICOLON, TokenType.EQ]);
    const t = consume();
    if (t.type === TokenType.SEMICOLON) {
        return left;
    } else if (t.type === TokenType.EQ) {
        const right = parse_expr(peek, consume, [TokenType.SEMICOLON]);
        expect_type(TokenType.SEMICOLON, consume());
        return make_assignment(left, right);
    } else unexpected(t);
}
function parse_if_else(peek: StackOp, consume: StackOp): IfElse {
    // if ( expr ) stmt else stmt
    // if ( expr ) stmt

    expect_type(TokenType.IF, consume());
    expect_type(TokenType.LPAREN, consume());
    const pred = parse_expr(peek, consume, [TokenType.RPAREN]);
    expect_type(TokenType.RPAREN, consume());
    const on_true = parse_stmt(peek, consume);
    if (peek().type === TokenType.ELSE) {
        consume();
        const on_false = parse_stmt(peek, consume);
        return make_if_else(pred, on_true, on_false);
    } else {
        return make_if_else(pred, on_true, null);
    }
}
function parse_while(peek: StackOp, consume: StackOp): While {
    // while ( expr ) stmt
    expect_type(TokenType.WHILE, consume());
    expect_type(TokenType.LPAREN, consume());
    const pred = parse_expr(peek, consume, [TokenType.RPAREN]);
    expect_type(TokenType.RPAREN, consume());
    const body = parse_stmt(peek, consume);
    return make_while(pred, body);
}

function parse_return(peek: StackOp, consume: StackOp): Return {
    // return ;
    // return expr ;

    expect_type(TokenType.RETURN, consume());
    if (peek().type === TokenType.SEMICOLON) {
        consume();
        return make_return(null);
    } else {
        const val = parse_expr(peek, consume, [TokenType.SEMICOLON]);
        expect_type(TokenType.SEMICOLON, consume());
        return make_return(val);
    }
}
function parse_stmt(peek: StackOp, consume: StackOp): Stmt {
    const t = peek();
    switch (t.type) {
        case TokenType.VAR:
            return parse_decl(peek, consume);
        case TokenType.IF:
            return parse_if_else(peek, consume);
        case TokenType.WHILE:
            return parse_while(peek, consume);
        case TokenType.RETURN:
            return parse_return(peek, consume);
        case TokenType.CONTINUE:
            consume();
            expect_type(TokenType.SEMICOLON, consume());
            return make_continue();
        case TokenType.BREAK:
            consume();
            expect_type(TokenType.SEMICOLON, consume());
            return make_break();
        case TokenType.LBRACKET:
            consume();
            const block = parse_block(peek, consume, [TokenType.RBRACKET]);
            expect_type(TokenType.RBRACKET, consume());
            return block;
        case TokenType.SEMICOLON:
            consume();
            return make_nop();

        default:
            return parse_expr_stmt(peek, consume);
    }
}
function parse_block(peek: StackOp, consume: StackOp, end: TokenType[]): Block {
    const list: Stmt[] = [];
    while (!end.includes(peek().type)) {
        list.push(parse_stmt(peek, consume));
    }
    return make_block(list);
}

export function parse(tokens: Token[]): Block {
    let i: number = 0;

    if (!tokens.map(t => t.type).includes(TokenType.EOF)) {
        throw new SyntaxError("No end of file.");
    }

    function peek(): Token {
        return tokens[i];
    }
    function consume(): Token {
        const t = tokens[i];
        // stop before end of file
        if (t.type !== TokenType.EOF) i++;
        return t;
    }

    return parse_block(peek, consume, [TokenType.EOF]);
}
