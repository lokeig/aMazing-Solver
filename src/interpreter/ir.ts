export class Env {
    /*
    private parent: Env | null;
    private frame: Map<string, any>;

    constructor(parent: Env | null) {
        this.parent = parent;
        this.frame = new Map();
    }

    get(name: string): any {
        if (this.frame.has(name)) {
            const val = this.frame.get(name);
            if (val === undefined) {
                throw new ReferenceError(`'${name}' is undefined.`);
            } else {
                return val;
            }
        } else if (this.parent === null) {
            throw new ReferenceError(`'${name}' is undeclared.`);
        } else {
            return this.parent.get(name);
        }
    }

    set(name: string, val: any): void {
        if (val === undefined) {
            throw new ReferenceError(`Cannot assign undefined to '${name}'.`);
        } if (this.frame.has(name)) {
            this.frame.set(name, val);
        } else if (this.parent === null) {
            throw new ReferenceError(`'${name}' is undeclared.`);
        } else {
            this.parent.set(name, val);
        }
    }

    declare(name: string, val: any): void {
        if (this.frame.has(name)) {
            throw new ReferenceError(`'${name}' is already declared.`);
        } else {
            this.frame.set(name, val);
        }
    }
    */
};

export type Var = { tag: "var", name: string };
export type Int = { tag: "int", val: number };
export type Arr = { tag: "arr", elems: Expr[] };
export type Lambda = { tag: "lambda", params: Var[], body: Block };

export type Fun = { tag: "fun", lambda: Lambda, env: Env };

export type UnOp = { tag: "unary_op", symbol: string, operand: Expr };
export type BinOp = { tag: "binary_op", symbol: string, left: Expr, right: Expr };
export type Call = { tag: "call", f: Expr, args: Expr[] };
export type Acc = { tag: "access", arr: Expr, i: Expr }

export type Decl = { tag: "decl", var: Var, val: Expr };
export type Asgmt = { tag: "assign", var: Expr, val: Expr };
export type IfElse = { tag: "if_else", pred: Expr, on_true: Stmt, on_false: Stmt };
export type While = { tag: "while", pred: Expr, body: Stmt };

export type Return = { tag: "return", val: Expr | null };
export type Continue = { tag: "continue" };
export type Break = { tag: "break" };
export type NOP = { tag: "no_op" };

export type Expr = Var | Int | Arr | Lambda | UnOp | BinOp | Call | Acc;
export type Stmt = NOP | Expr | Decl | Asgmt | IfElse | While | Return | Continue | Break | Block;
export type Block = { tag: "block", body: Stmt[] };


export function make_var(name: string): Var {
    return { tag: "var", name };
}

export function make_int(val: number): Int {
    return { tag: "int", val };
}

export function make_arr(elems: Expr[]): Arr {
    return { tag: "arr", elems };
}

export function make_lambda(params: Var[], body: Block): Lambda {
    return { tag: "lambda", params, body };
}

export function make_unary(symbol: string, operand: Expr): UnOp {
    return { tag: "unary_op", symbol, operand };
}

export function make_binary(symbol: string, left: Expr, right: Expr): BinOp {
    return { tag: "binary_op", symbol, left, right };
}

export function make_call(f: Expr, args: Expr[]): Call {
    return { tag: "call", f, args };
}

export function make_access(arr: Expr, i: Expr): Acc {
    return { tag: "access", arr, i };
}

export function make_decl(name: string, val: Expr): Decl {
    return { tag: "decl", var: make_var(name), val };
}

export function make_assignment(variable: Expr, val: Expr): Asgmt {
    return { tag: "assign", var: variable, val };
}

export function make_if_else(pred: Expr, on_true: Stmt, on_false: Stmt | null): IfElse {
    return { tag: "if_else", pred, on_true, on_false: on_false ?? make_nop() };
}

export function make_while(pred: Expr, body: Stmt): While {
    return { tag: "while", pred, body };
}

export function make_return(val: Expr | null): Return {
    return { tag: "return", val };
}

export function make_continue(): Continue {
    return { tag: "continue" };
}

export function make_break(): Break {
    return { tag: "break" };
}

export function make_nop(): NOP {
    return { tag: "no_op" };
}

export function make_block(body: Stmt[]): Block {
    return { tag: "block", body };
}