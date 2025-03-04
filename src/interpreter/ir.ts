export type Var = { tag: "var", name: string };
export type Int = { tag: "int", val: number };
export type Arr = { tag: "arr", elems: Expr[] };
export type Lambda = { tag: "lambda", params: Var[], body: Block };

export type UnOp = { tag: "unary_op", symbol: string, operand: Expr };
export type BinOp = { tag: "binary_op", symbol: string, left: Expr, right: Expr };
export type Call = { tag: "call", f: Expr, args: Expr[] };
export type Acc = { tag: "access", arr: Expr, i: Expr }

export type Decl = { tag: "decl", var: Var, val: Expr };
export type Asgmt = { tag: "assign", var: Expr, val: Expr };
export type IfElse = { tag: "if_else", pred: Expr, on_true: Stmt, on_false: Stmt };
export type While = { tag: "while", pred: Expr, body: Stmt };
export type For = { tag: "for", start: Expr | Decl | Asgmt, pred: Expr, end: Expr | Asgmt, body: Stmt };

export type Return = { tag: "return", val: Expr | null };
export type Continue = { tag: "continue" };
export type Break = { tag: "break" };
export type NOP = { tag: "no_op" };

export type Expr = Var | Int | Arr | Lambda | UnOp | BinOp | Call | Acc;
export type Stmt = NOP | Expr | Decl | Asgmt | IfElse | While | For | Return | Continue | Break | Block;
export type Block = { tag: "block", body: Stmt[] };

/**
 * Var constructor
 * @param name The name of the variable
 * @returns A new Var object
 */
export function make_var(name: string): Var {
    return { tag: "var", name };
}
/**
 * Int constructor
 * @param val The value of the integer
 * @returns A new Int object
 */
export function make_int(val: number): Int {
    return { tag: "int", val };
}
/**
 * Arr constructor
 * @param elems The elements of the array
 * @returns A new Arr object
 */
export function make_arr(elems: Expr[]): Arr {
    return { tag: "arr", elems };
}
/**
 * Lambda constructor
 * @param params The parameters of the lambda function
 * @param body The body of the lambda function
 * @returns A new Lambda object
 */
export function make_lambda(params: Var[], body: Block): Lambda {
    return { tag: "lambda", params, body };
}
/**
 * UnOp constructor
 * @param symbol The symbol of the unary operator
 * @param operand The operand of the unary operator
 * @returns A new UnOp object
 */
export function make_unary(symbol: string, operand: Expr): UnOp {
    return { tag: "unary_op", symbol, operand };
}
/**
 * BinOp constructor
 * @param symbol The symbol of the binary operator
 * @param left The left operand of the binary operator
 * @param right The right operand of the binary operator
 * @returns A new BinOp object
 */
export function make_binary(symbol: string, left: Expr, right: Expr): BinOp {
    return { tag: "binary_op", symbol, left, right };
}
/**
 * Call constructor
 * @param f The function to be called
 * @param args The argument to be passed in the function call
 * @returns A new Call object
 */
export function make_call(f: Expr, args: Expr[]): Call {
    return { tag: "call", f, args };
}
/**
 * Acc constructor
 * @param arr The array to subscript
 * @param i The index in the subscript
 * @returns A new Acc object
 */
export function make_access(arr: Expr, i: Expr): Acc {
    return { tag: "access", arr, i };
}
/**
 * Decl constructor
 * @param name The name of the variable to declare
 * @param val The value to declare the variable to
 * @returns A new Decl object
 */
export function make_decl(name: string, val: Expr): Decl {
    return { tag: "decl", var: make_var(name), val };
}
/**
 * Asgmt constructor
 * @param variable The variable or subscript to be assigned
 * @param val The value to assign
 * @returns A new Asgmt object
 */
export function make_assignment(variable: Expr, val: Expr): Asgmt {
    return { tag: "assign", var: variable, val };
}
/**
 * IfElse constructor
 * @param pred The predicate expression to determine which branch to choose
 * @param on_true The statement to evaluate if pred is truthy
 * @param on_false The statement to evaluate if pred is not truthy
 * @returns A new IfElse object
 */
export function make_if_else(pred: Expr, on_true: Stmt, on_false: Stmt | null): IfElse {
    return { tag: "if_else", pred, on_true, on_false: on_false ?? make_nop() };
}
/**
 * While constructor
 * @param pred The predicate expression to determine wether to keep looping
 * @param body The statement to evaluate while pred is truthy
 * @returns A new While object
 */
export function make_while(pred: Expr, body: Stmt): While {
    return { tag: "while", pred, body };
}
/**
 * For constructor
 * @param start The statement to execute before the loop begins
 * @param pred The predicate expression to determine wether to keep looping
 * @param end The expression to evaluate at the end of every loop
 * @param body The statement to evaluate while pred is truthy
 * @returns A new For object
 */
export function make_for(start: Expr | Decl | Asgmt, pred: Expr, end: Expr | Asgmt, body: Stmt): For {
    return { tag: "for", start, pred, end, body };
}
/**
 * Return constructor
 * @param val The value to be returned, or null to return 0
 * @returns A new Return object
 */
export function make_return(val: Expr | null): Return {
    return { tag: "return", val };
}
/**
 * Continue constructor
 * @returns A new Continue object
 */
export function make_continue(): Continue {
    return { tag: "continue" };
}
/**
 * Break constructor
 * @returns A new Break object
 */
export function make_break(): Break {
    return { tag: "break" };
}
/**
 * NOP constructor
 * @returns A new NOP object
 */
export function make_nop(): NOP {
    return { tag: "no_op" };
}
/**
 * Block constructor
 * @param body The statements inside the code block
 * @returns A new Block object
 */
export function make_block(body: Stmt[]): Block {
    return { tag: "block", body };
}
/**
 * Checks if a statement is an expression statement.
 * @param stmt The statement to check
 * @returns Wether stmt is an Expr object
 */
export function is_expr(stmt: Stmt): stmt is Expr {
    return ["var", "int", "arr", "lambda", "unary_op", "binary_op", "call", "access"].includes(stmt.tag);
}
