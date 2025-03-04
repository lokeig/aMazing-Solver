import { type Decl, type Block, type Expr, type Int, make_decl, make_var, make_int, make_arr, make_unary, make_call, make_access, type Stmt, make_lambda, make_binary, type Asgmt, make_assignment, make_if_else, type IfElse, type While, make_while, type Return, make_return, make_nop, make_continue, make_break, make_block, type For, make_for } from "./ir";
import { token_err_name, TokenType, type Token } from "./tokenizer";

// function operating on the token stack
type StackOp = () => Token;

// returns the operator precedence (higher number should be evaluated first)
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

// throws unexpected token syntax error 
function unexpected(token: Token): never {
    throw new SyntaxError(`Unexpected ${token_err_name(token.type)} at line ${token.ln}, column ${token.col}.`);
}
// throws unexpected token syntax error describing was what expected
function expect_type(type: TokenType, token: Token): Token {
    if (token.type === type) {
        return token;
    } else {
        throw new SyntaxError(
            `Expected ${token_err_name(type)} but got ${token_err_name(token.type)} at line ${token.ln}, column ${token.col}.`
        );
    }
}

// returns the digit value in any base <= 36 or null if not a digit in that base
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
// converts integer token to integer value
function parse_int(token: Token): Int {
    const str = token.str;
    let i = 0; // index of where the actual integer starts
    let base = 10; // default to decimal
    if (str.startsWith("0x") || str.startsWith("0X")) { // hexadecimal
        i = 2;
        base = 16;
    } else if (str.startsWith("0b") || str.startsWith("0B")) { // binary
        i = 2;
        base = 2;
    }

    let val: number | null = null;
    while (i < str.length) {
        const char = str[i++];
        if (char === "_") continue; // ignore underscores

        const char_val = char_val_in_base(char, base);
        if (char_val === null) { // invalid digit
            throw new SyntaxError(
                `Invalid digit '${char}' in base ${base} integer literal at line ${token.ln}, column ${token.col}.`
            );
        } else if (val === null) {
            val = char_val;
        } else {
            val = val * base + char_val;
        }
    }

    if (val === null) { // must contain at least one digit
        throw new SyntaxError(`Invlaid integer literal at line ${token.ln}, column ${token.col}.`);
    }

    return make_int(val);
}

// parse a list of elements parsed with elem_parser, separated by a token in delim
// and ending with a token in end which is not consumed
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

// parse all unary postfix operators on current term
function parse_unary(peek: StackOp, consume: StackOp, operand: Expr): Expr {
    const t = peek();

    let res: Expr;
    switch (t.type) {
        case TokenType.LPAREN: // function call
            // ( x , y , z )
            consume();
            const args = parse_list(
                peek, consume,
                [TokenType.COMMA], [TokenType.RPAREN],
                (peek, consume) => parse_expr(peek, consume, [TokenType.COMMA, TokenType.RPAREN])
            );
            expect_type(TokenType.RPAREN, consume());
            res = make_call(operand, args);
            break;
        case TokenType.LSQUARE: // array subscripting
            // [ x ]
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
// parse all unary operators on current term and parenthesis grouping
function parse_term(peek: StackOp, consume: StackOp): Expr {
    const t = consume();

    let res: Expr;
    switch (t.type) {
        case TokenType.NAME: // variable name
            res = make_var(t.str);
            break;
        case TokenType.INT: // integer literal
            res = parse_int(t);
            break

        case TokenType.FN: // function literal
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
            // ( x )
            res = parse_expr(peek, consume, [TokenType.RPAREN]);
            expect_type(TokenType.RPAREN, consume());
            break;
        case TokenType.LSQUARE: // array literal
            // [ x , y , z ]
            res = make_arr(parse_list(
                peek, consume,
                [TokenType.COMMA], [TokenType.RSQUARE],
                (peek, consume) => parse_expr(peek, consume, [TokenType.COMMA, TokenType.RSQUARE])
            ));
            expect_type(TokenType.RSQUARE, consume());
            break;

        // unary prefix operators
        case TokenType.EXLAMATION:
        case TokenType.PLUS:
        case TokenType.MINUS:
            // recursive to allow stacked prefix
            res = make_unary(t.str, parse_term(peek, consume));
            break;

        default: unexpected(t);
    }

    // parse postfix
    return parse_unary(peek, consume, res);
}

// checks wether t is a token
function is_token(t: Expr | Token): t is Token {
    return "type" in t && Object.values(TokenType).includes(t.type)
}
// converts infix notation to postfix notation
function shunting_yard(input: (Expr | Token)[]): (Expr | Token)[] {
    const output: (Expr | Token)[] = [];
    const operator: Token[] = []

    for (const t of input) {
        if (is_token(t)) switch (t.type) {
            case TokenType.LPAREN:
                operator.push(t);
                break;
            case TokenType.RPAREN:
                while (true) {
                    const top = operator.pop();
                    if (top === undefined) unexpected(t); // mismatched parenthesis
                    else if (top.type === TokenType.LPAREN) break;
                    else output.push(top);
                }
                break
            default:
                while (true) {
                    const top = operator.at(-1);
                    if (top === undefined || top.type === TokenType.LPAREN) break;
                    if (operator_precedence(top.str) < operator_precedence(t.str)) break;
                    operator.pop();
                    output.push(top);
                }
                operator.push(t);
                break;
        } else { // value
            output.push(t);
        }
    }
    while (true) {
        const top = operator.pop();
        if (top === undefined) break;
        else if (top.type === TokenType.LPAREN) unexpected(top) // mismatched parenthesis
        else output.push(top);
    }

    return output;
}
// parse any expression, stopping when a token in end is encountered at a valid position
function parse_expr(peek: StackOp, consume: StackOp, end: TokenType[]): Expr {
    // evaluate terms as infix
    const infix: (Expr | Token)[] = [
        parse_term(peek, consume)
    ];
    while (!end.includes(peek().type)) {
        const t = consume();
        switch (t.type) {
            // should not be present after parse_term but left in case that would need changing
            case TokenType.LPAREN:
            case TokenType.RPAREN:
            // valid operators
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
                infix.push(t);
                break;

            default: unexpected(t);
        }
        infix.push(parse_term(peek, consume));
    }

    // convert to postfix
    const postfix = shunting_yard(infix);

    // evaluate postfix
    const stack: Expr[] = [];
    for (const t of postfix) {
        if (is_token(t)) {
            // pop top 2 to use as arguments and push result back on top
            const right = stack.pop();
            const left = stack.pop();
            if (right === undefined || left === undefined) unexpected(t) // not sure if this can occur
            stack.push(make_binary(t.str, left, right));
        } else {
            stack.push(t);
        }
    }
    if (stack.length !== 1) throw new SyntaxError("Invalid Expression."); // not sure if this can occur
    return stack[0];
}

// parse declaration statement
function parse_decl(peek: StackOp, consume: StackOp): Decl {
    // var name = ... ;
    expect_type(TokenType.VAR, consume());
    const name = expect_type(TokenType.NAME, consume()).str;
    expect_type(TokenType.EQ, consume());
    const expr = parse_expr(peek, consume, [TokenType.SEMICOLON]);
    expect_type(TokenType.SEMICOLON, consume());
    return make_decl(name, expr);
}
// parse expression or assignment statement
function parse_expr_stmt(peek: StackOp, consume: StackOp): Asgmt | Expr {
    // expr ;
    // expr = expr ;
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
// parses if or if-else statement
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
// parses while statement
function parse_while(peek: StackOp, consume: StackOp): While {
    // while ( expr ) stmt
    expect_type(TokenType.WHILE, consume());
    expect_type(TokenType.LPAREN, consume());
    const pred = parse_expr(peek, consume, [TokenType.RPAREN]);
    expect_type(TokenType.RPAREN, consume());
    const body = parse_stmt(peek, consume);
    return make_while(pred, body);
}
// parse for statement
function parse_for(peek: StackOp, consume: StackOp): For {
    // for ( expr ; expr ; expr ) stmt
    // for ( expr = expr ; expr ; expr ) stmt
    // for ( var name = expr ; expr ; expr ) stmt
    // for ( expr ; expr ; expr = expr ) stmt
    // for ( expr = expr ; expr ; expr = expr ) stmt
    // for ( var name = expr ; expr ; expr = expr ) stmt
    expect_type(TokenType.FOR, consume());
    expect_type(TokenType.LPAREN, consume());
    const start = peek().type === TokenType.VAR
        ? parse_decl(peek, consume)
        : parse_expr_stmt(peek, consume);
    const pred = parse_expr(peek, consume, [TokenType.SEMICOLON]);
    expect_type(TokenType.SEMICOLON, consume());

    let end: Expr | Asgmt;
    const left = parse_expr(peek, consume, [TokenType.RPAREN, TokenType.EQ]);
    const t = consume();
    if (t.type === TokenType.RPAREN) {
        end = left;
    } else if (t.type === TokenType.EQ) {
        const right = parse_expr(peek, consume, [TokenType.RPAREN]);
        expect_type(TokenType.RPAREN, consume());
        end = make_assignment(left, right);
    } else unexpected(t);

    const body = parse_stmt(peek, consume);
    return make_for(start, pred, end, body);
}

// parses return or return value statement
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

// parses any statement
function parse_stmt(peek: StackOp, consume: StackOp): Stmt {
    const t = peek();
    switch (t.type) {
        case TokenType.VAR:
            return parse_decl(peek, consume);
        case TokenType.IF:
            return parse_if_else(peek, consume);
        case TokenType.WHILE:
            return parse_while(peek, consume);
        case TokenType.FOR:
            return parse_for(peek, consume);
        case TokenType.RETURN:
            return parse_return(peek, consume);
        case TokenType.CONTINUE:
            // continue ;
            consume();
            expect_type(TokenType.SEMICOLON, consume());
            return make_continue();
        case TokenType.BREAK:
            // break ;
            consume();
            expect_type(TokenType.SEMICOLON, consume());
            return make_break();
        case TokenType.LBRACKET: // code block
            // { ... }
            consume();
            const block = parse_block(peek, consume, [TokenType.RBRACKET]);
            expect_type(TokenType.RBRACKET, consume());
            return block;
        case TokenType.SEMICOLON: // no operation
            // ;
            consume();
            return make_nop();

        default:
            return parse_expr_stmt(peek, consume);
    }
}
// parse code block stopping when a token in end is encountered at a valid position
function parse_block(peek: StackOp, consume: StackOp, end: TokenType[]): Block {
    const list: Stmt[] = [];
    while (!end.includes(peek().type)) {
        list.push(parse_stmt(peek, consume));
    }
    return make_block(list);
}

/**
 * Converts an array of tokens to intermediate representation to use for evaluating.
 * Throws syntax error when encountering invalid token sequences.
 * @param tokens The program token array
 * @returns The parsed program
 */
export function parse(tokens: Token[]): Block {
    let i: number = 0; // treat tokens as stack with i pointing to the top

    // must have an end of file
    if (!tokens.map(t => t.type).includes(TokenType.EOF)) {
        throw new SyntaxError("No end of file.");
    }

    // return the top of the token "stack"
    function peek(): Token {
        return tokens[i];
    }
    // remove and return the top of the "stack"
    function consume(): Token {
        const t = tokens[i];
        // never remove the end of file
        if (t.type !== TokenType.EOF) i++;
        return t;
    }

    return parse_block(peek, consume, [TokenType.EOF]);
}
