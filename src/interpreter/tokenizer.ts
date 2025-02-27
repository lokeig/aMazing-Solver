export enum TokenType {
    NAME,
    INT,

    VAR,
    FN,
    IF,
    ELSE,
    WHILE,

    RETURN,
    CONTINUE,
    BREAK,

    LPAREN,
    RPAREN,
    LSQUARE,
    RSQUARE,
    LBRACKET,
    RBRACKET,
    LANGLE,
    RANGLE,

    EQ,
    EQEQ,
    NEQ,
    LEQ,
    GEQ,

    ANDAND,
    OROR,

    EXLAMATION,
    PLUS,
    MINUS,
    STAR,
    SLASH,
    PERCENT,

    COMMA,
    SEMICOLON,
    EOF,
};

export type Token = {
    type: TokenType,
    str: string,
    ln: number,
    col: number
};

export function make_token(type: TokenType, str: string, ln: number, col: number): Token {
    return { type, str, ln, col };
}

export function token_err_name(type: TokenType): string {
    switch (type) {
        case TokenType.NAME: return "name";
        case TokenType.INT: return "integer";
        case TokenType.VAR: return "'var'";
        case TokenType.FN: return "'fn'";
        case TokenType.IF: return "'if'";
        case TokenType.ELSE: return "'else'";
        case TokenType.WHILE: return "'while'";
        case TokenType.RETURN: return "'return'";
        case TokenType.CONTINUE: return "'continue'";
        case TokenType.BREAK: return "'break'";
        case TokenType.LPAREN: return "'('";
        case TokenType.RPAREN: return "')'";
        case TokenType.LSQUARE: return "'['";
        case TokenType.RSQUARE: return "']'";
        case TokenType.LBRACKET: return "'{'";
        case TokenType.RBRACKET: return "'}'";
        case TokenType.LANGLE: return "'<'";
        case TokenType.RANGLE: return "'>'";
        case TokenType.EQ: return "'='";
        case TokenType.EQEQ: return "'=='";
        case TokenType.NEQ: return "'!='";
        case TokenType.LEQ: return "'<='";
        case TokenType.GEQ: return "'>='";
        case TokenType.ANDAND: return "'&&'";
        case TokenType.OROR: return "'||'";
        case TokenType.EXLAMATION: return "'!'";
        case TokenType.PLUS: return "'+'";
        case TokenType.MINUS: return "'-'";
        case TokenType.STAR: return "'*'";
        case TokenType.SLASH: return "'/'";
        case TokenType.PERCENT: return "'%'";
        case TokenType.COMMA: return "','";
        case TokenType.SEMICOLON: return "';'";
        case TokenType.EOF: return "end of file";
    }
}

function is_int(s: string): boolean {
    return /^[0-9][_0-9a-zA-Z]*$/.test(s);
}

function is_name(s: string): boolean {
    return /^[_a-zA-Z][_0-9a-zA-Z]*$/.test(s);
}

function get_keyword(s: string): TokenType | null {
    switch (s) {
        case "var": return TokenType.VAR;
        case "fn": return TokenType.FN;
        case "if": return TokenType.IF;
        case "else": return TokenType.ELSE;
        case "while": return TokenType.WHILE;

        case "return": return TokenType.RETURN;
        case "continue": return TokenType.CONTINUE;
        case "break": return TokenType.BREAK;

        default: return null;
    }
}

function get_symbol(s: string): TokenType | null {
    switch (s) {
        case "(": return TokenType.LPAREN;
        case ")": return TokenType.RPAREN;
        case "{": return TokenType.LBRACKET;
        case "}": return TokenType.RBRACKET;
        case "[": return TokenType.LSQUARE;
        case "]": return TokenType.RSQUARE;
        case "<": return TokenType.LANGLE;
        case ">": return TokenType.RANGLE;

        case "=": return TokenType.EQ;
        case "==": return TokenType.EQEQ;
        case "!=": return TokenType.NEQ;
        case "<=": return TokenType.LEQ;
        case ">=": return TokenType.GEQ;

        case "&&": return TokenType.ANDAND;
        case "||": return TokenType.OROR;

        case "!": return TokenType.EXLAMATION;
        case "+": return TokenType.PLUS;
        case "-": return TokenType.MINUS;
        case "*": return TokenType.STAR;
        case "/": return TokenType.SLASH;
        case "%": return TokenType.PERCENT;

        case ",": return TokenType.COMMA;
        case ";": return TokenType.SEMICOLON;

        default: return null;
    }
}

function get_token_type(s: string): TokenType | null {
    return get_keyword(s)
        ?? get_symbol(s)
        ?? (is_int(s) ? TokenType.INT
            : is_name(s) ? TokenType.NAME
                : null);
}

export function tokenize(s: string, tabsize: number = 4): Token[] {
    const tokens: Token[] = []

    let ln: number = 1;
    let col: number = 1;

    let current_ln: number = ln;
    let current_col: number = col;
    let current: string = "";
    for (let i = 0; i <= s.length; i++) {
        let end_token: boolean = false;

        const char: string | undefined = s[i];
        switch (char) {
            case undefined: // end of input
                end_token = true;
                break;
            case "\n":
                ln++;
                col = 1;
                end_token = true;
                break;
            case " ":
                col++
                end_token = true;
                break;
            case "\t":
                col += tabsize - (col - 1) % tabsize; // next multiple of 4 + 1
                end_token = true;
                break;
            default:
                // if it was valid but is no longer, push the valid one and continue on a new one
                if ((is_int(current) && !is_int(current + char)) ||
                    (is_name(current) && !is_name(current + char)) ||
                    (get_symbol(current) !== null && get_symbol(current + char) === null)
                ) {
                    end_token = true;
                    i--; // return to same char next iteration
                } else {
                    col++;
                }
                break;
        }

        if (end_token) {
            if (current.length > 0) {
                const type = get_token_type(current);
                if (type === null) {
                    throw new SyntaxError(`Unrecognized token '${current}' at line ${ln}, column ${col}.`);
                } else {
                    tokens.push(make_token(type, current, current_ln, current_col));
                    current = "";
                }
            }

            current_ln = ln;
            current_col = col;
        } else {
            current += char;
        }
    }

    tokens.push(make_token(TokenType.EOF, "", current_ln, current_col));
    return tokens;
}
