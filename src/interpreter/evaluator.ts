import { is_wall, make_pos, type MazeSolver, solver_wrapper } from "../maze";
import { type BinOp, type Block, type Break, type Continue, type Expr, is_expr, make_break, make_continue, make_int, type Stmt, type UnOp, type Int, type Lambda, type Var } from "./ir";
import { parse } from "./parser";
import { tokenize } from "./tokenizer";

// Frame in the environment model
class Env {
    private parent: Env | null; // previous frame
    private frame: Map<string, RValue>; // name value lookup

    constructor(parent: Env | null) {
        this.parent = parent;
        this.frame = new Map();
    }

    // get value of variable with name
    get(name: string): RValue {
        if (this.frame.has(name)) {
            const val = this.frame.get(name);
            if (val === undefined) { // won't happen currently since you can't declare without value
                throw new ReferenceError(`'${name}' is undefined.`);
            } else {
                return val;
            }
        } else if (this.parent === null) {
            throw new ReferenceError(`'${name}' is undeclared.`);
        } else {
            return this.parent.get(name); // get from previous frame
        }
    }

    // set value of variable with name
    set(name: string, val: RValue): void {
        if (this.frame.has(name)) {
            this.frame.set(name, val);
        } else if (this.parent === null) {
            throw new ReferenceError(`'${name}' is undeclared.`);
        } else {
            this.parent.set(name, val); // set in previous frame
        }
    }

    // declare variable with name and value
    declare(name: string, val: RValue): void {
        if (this.frame.has(name)) {
            throw new ReferenceError(`'${name}' is already declared.`);
        } else {
            this.frame.set(name, val);
        }
    }
};

// user defined function
type LocalFun = { tag: "local_fun", lambda: Lambda, env: Env };
// predeclared function
type BuiltinFun = { tag: "builtin_fun", f: (args: RValue[]) => RValue | void };
type Fun = LocalFun | BuiltinFun;

// actual values
type Arr = { tag: "r_arr", arr: RValue[] }
export type RValue = Int | Fun | Arr;

// assignable values that can be read to get rvalues
type Ref = { tag: "ref", arr: Arr, i: number };
type LValue = Var | Ref;

type Ret = { tag: "r_ret", val: RValue | null };
type JmpStmt = null | Ret | Continue | Break;

/**
 * RValue constructor for predeclared functions.
 * @param f The function to be called
 * @returns A new RValue
 */
export function make_builtin(f: (args: RValue[]) => RValue | void): BuiltinFun {
    return { tag: "builtin_fun", f };
}
/**
 * RValue constructor for user defined function
 * @param lambda The parsed lambda function to evaluate when called
 * @param env The environment the function will point to when called 
 * @returns A new RValue
 */
export function make_fun(lambda: Lambda, env: Env): LocalFun {
    return { tag: "local_fun", lambda, env };
}
/**
 * RValue constructor for arrays.
 * @param arr An array of the elements the array should include
 * @returns A new RValue
 */
export function make_arr(arr: RValue[]): Arr {
    return { tag: "r_arr", arr };
}
// RValue constructor for return statements
function make_ret(val: RValue | null): Ret {
    return { tag: "r_ret", val };
}
// LValue constructor for array subscripts
function make_ref(arr: Arr, i: number): Ref {
    return { tag: "ref", arr, i };
}

// Wether val is an LValue
function is_lval(val: RValue | LValue): val is LValue {
    return ["var", "ref"].includes(val.tag);
}
// Wether val is an integer
function is_int(val: RValue): val is Int {
    return val.tag === "int";
}
// Wether val is a predefined function
function is_builtin(val: RValue): val is BuiltinFun {
    return val.tag === "builtin_fun";
}
// Wether val is a user defined function
function is_local(val: RValue): val is LocalFun {
    return val.tag === "local_fun";
}
// Wether val is a function
function is_fun(val: RValue): val is Fun {
    return is_local(val) || is_builtin(val);
}
// Wether val is an Array
function is_arr(val: RValue): val is Arr {
    return val.tag === "r_arr";
}

// The name of the type to use in error messages
function type_err_name(t: RValue): string {
    if (is_int(t)) return "integer";
    if (is_fun(t)) return "function";
    if (is_arr(t)) return "array";
    return "{ error }"; // can't happen
}
// throw error unless the length of argv matches argc
function enforce_argc(argc: number, argv: RValue[]): void {
    if (argc < argv.length) {
        throw new TypeError("Too many arguments in function call.");
    } else if (argc > argv.length) {
        throw new TypeError("Too few arguments in function call.");
    }
}

// whether variable is truthy
function is_truthy(val: RValue): boolean {
    if (is_int(val)) return val.val !== 0;
    if (is_fun(val)) return true;
    if (is_arr(val)) return val.arr.length > 0;
    return false; // can't happen
}
// whether to values are equal
function is_eq(left: RValue, right: RValue) {
    if (left.tag !== right.tag) return make_int(0); // type mismatch
    if (is_int(left) && is_int(right)) return make_int(left.val === right.val ? 1 : 0); // integers are special
    return make_int(left === right ? 1 : 0); // must be the same objects
}

// get the value from an lvalue or just return the rvalue
function get_rval(val: RValue | LValue, env: Env): RValue {
    if (val.tag === "var") { // variable lookup
        return env.get(val.name);
    } else if (val.tag === "ref") { // array subscript
        if (0 <= val.i && val.i < val.arr.arr.length) { // make sure it's not out of range
            return val.arr.arr[val.i];
            // i don't believe this should ever error
        } else throw new RangeError(`${val.i} is outside the range of array with length ${val.arr.arr.length}`);
    } else { // rvalue to begin with
        return val;
    }
}
// assign to lvalue
function set_lval(lval: LValue, rval: RValue, env: Env): void {
    if (lval.tag === "var") { // variable assignment
        env.set(lval.name, rval);
    } else if (0 <= lval.i && lval.i < lval.arr.arr.length) { // array subscript
        lval.arr.arr[lval.i] = rval;
        // i don't believe this should ever error
    } else throw new RangeError(`${lval.i} is outside the range of array with length ${lval.arr.arr.length}`);
}
// declare variable name
function decl_var(variable: Var, rval: RValue, env: Env): void {
    env.declare(variable.name, rval);
}

// evaluate unary prefix operator
function eval_unary(op: UnOp, env: Env): RValue {
    let oper: RValue;
    switch (op.symbol) {
        case "!": // logical not
            oper = get_rval(eval_expr(op.operand, env), env);
            return make_int(is_truthy(oper) ? 0 : 1);
        case "+": // no nothing
            oper = get_rval(eval_expr(op.operand, env), env);
            if (is_int(oper)) {
                return oper;
            } else break;
        case "-": // negate value
            oper = get_rval(eval_expr(op.operand, env), env);
            if (is_int(oper)) {
                return make_int(-oper.val);
            } else break;

        default: throw new SyntaxError(`Invalid unary operator '${op.symbol}'.`);
    }
    throw new TypeError(`Invalid type '${type_err_name(oper)}' in unary operator '${op.symbol}'.`);
}
// evaluate binary operator
function eval_binary(op: BinOp, env: Env): RValue {
    let left: RValue;
    let right: RValue;
    switch (op.symbol) {
        case "||":
            left = get_rval(eval_expr(op.left, env), env);
            if (is_truthy(left)) return left; // short-circuit
            else return get_rval(eval_expr(op.right, env), env);
        case "&&":
            left = get_rval(eval_expr(op.left, env), env);
            if (!is_truthy(left)) return left; // short-circuit
            else return get_rval(eval_expr(op.right, env), env);
        case "==":
            left = get_rval(eval_expr(op.left, env), env);
            right = get_rval(eval_expr(op.right, env), env);
            return is_eq(left, right);
        case "!=":
            left = get_rval(eval_expr(op.left, env), env);
            right = get_rval(eval_expr(op.right, env), env);
            return make_int(is_truthy(is_eq(left, right)) ? 0 : 1);
        case "<":
            left = get_rval(eval_expr(op.left, env), env);
            right = get_rval(eval_expr(op.right, env), env);
            if (is_int(left) && is_int(right)) {
                return make_int(left.val < right.val ? 1 : 0);
            } else break;
        case ">":
            left = get_rval(eval_expr(op.left, env), env);
            right = get_rval(eval_expr(op.right, env), env);
            if (is_int(left) && is_int(right)) {
                return make_int(left.val > right.val ? 1 : 0);
            } else break;
        case "<=":
            left = get_rval(eval_expr(op.left, env), env);
            right = get_rval(eval_expr(op.right, env), env);
            if (is_int(left) && is_int(right)) {
                return make_int(left.val <= right.val ? 1 : 0);
            } else break;
        case ">=":
            left = get_rval(eval_expr(op.left, env), env);
            right = get_rval(eval_expr(op.right, env), env);
            if (is_int(left) && is_int(right)) {
                return make_int(left.val >= right.val ? 1 : 0);
            } else break;
        case "+":
            left = get_rval(eval_expr(op.left, env), env);
            right = get_rval(eval_expr(op.right, env), env);
            if (is_int(left) && is_int(right)) { // add integers
                return make_int(left.val + right.val);
            } else if (is_arr(left) && is_arr(right)) { // concatenate arrays
                return make_arr([...left.arr, ...right.arr]);
            } else break;
        case "-":
            left = get_rval(eval_expr(op.left, env), env);
            right = get_rval(eval_expr(op.right, env), env);
            if (is_int(left) && is_int(right)) {
                return make_int(left.val - right.val);
            } else break;
        case "*":
            left = get_rval(eval_expr(op.left, env), env);
            right = get_rval(eval_expr(op.right, env), env);
            if (is_int(left) && is_int(right)) {
                return make_int(left.val * right.val);
            } else break;
        case "/":
            left = get_rval(eval_expr(op.left, env), env);
            right = get_rval(eval_expr(op.right, env), env);
            if (is_int(left) && is_int(right)) {
                if (right.val === 0) {
                    throw new RangeError("Division by zero.");
                } else return make_int(Math.floor(left.val / right.val)); // floor division, not truncation
            } else break;
        case "%":
            left = get_rval(eval_expr(op.left, env), env);
            right = get_rval(eval_expr(op.right, env), env);
            if (is_int(left) && is_int(right)) {
                if (right.val === 0) {
                    throw new RangeError("Modulo by zero.");
                } else return make_int(((left.val % right.val) + right.val) % right.val); // smallest modulo, not remainder
            } else break;

        default: throw new SyntaxError(`Invalid binary operator '${op.symbol}'.`);
    }

    throw new TypeError(`Invalid types '${type_err_name(left)}', '${type_err_name(right)}' in binary operator '${op.symbol}'.`);
}
// evaluate function call
function eval_call(f: Fun, args: RValue[]): RValue {
    if (is_builtin(f)) { // predefined
        return f.f(args) ?? make_int(0); // return 0 by default
    } else { // user defined
        enforce_argc(f.lambda.params.length, args);
        // declare parameters in new frame
        const inner_env = new Env(f.env);
        f.lambda.params.forEach((v, i) => decl_var(v, args[i], inner_env));
        const jmp = eval_block(f.lambda.body, inner_env);
        if (jmp !== null && jmp.tag === "r_ret" && jmp.val !== null) {
            // value was returned
            return jmp.val;
        } else {
            // return 0 by default
            return make_int(0);
        }
    }
}
// evaluate array subscripting
function eval_access(arr: Arr, i: number): Ref {
    if (0 <= i && i < arr.arr.length) { // make sure it's not out of range
        return make_ref(arr, i);
    } else throw new RangeError(`${i} is outside the range of array with length ${arr.arr.length}`)
}

// evaluate any expression
function eval_expr(expr: Expr, env: Env): RValue | LValue {
    switch (expr.tag) {
        case "var":
            return expr;
        case "int":
            return expr;
        case "arr":
            return make_arr(expr.elems.map(e => get_rval(eval_expr(e, env), env)));
        case "lambda":
            return make_fun(expr, env);
        case "unary_op":
            return eval_unary(expr, env);
        case "binary_op":
            return eval_binary(expr, env);
        case "call":
            const f = get_rval(eval_expr(expr.f, env), env);
            if (is_fun(f)) {
                const args = expr.args.map(e => get_rval(eval_expr(e, env), env));
                return eval_call(f, args);
            } else {
                throw new TypeError(`Type '${type_err_name(f)}' is not callable.`);
            }
        case "access":
            const arr = get_rval(eval_expr(expr.arr, env), env);
            if (is_arr(arr)) {
                const i = get_rval(eval_expr(expr.i, env), env);
                if (is_int(i)) {
                    return eval_access(arr, i.val);
                } else {
                    throw new TypeError(`Type '${type_err_name(i)}' is not an index.`);
                }
            } else {
                throw new TypeError(`Type '${type_err_name(arr)}' is not subscriptable.`);
            }
    }
}

// evaluate any statement
function eval_stmt(stmt: Stmt, env: Env): JmpStmt {
    if (is_expr(stmt)) { // regular expression statement
        // get_rval to ensure no invalid references
        get_rval(eval_expr(stmt, env), env);
        return null;
    }

    switch (stmt.tag) {
        case "no_op":
            return null;
        case "decl":
            decl_var(stmt.var, get_rval(eval_expr(stmt.val, env), env), env);
            return null;
        case "assign":
            // evaluate right side first in case an array is modified before assigning to a subscript of it
            const rvalue = get_rval(eval_expr(stmt.val, env), env);
            const lvalue = eval_expr(stmt.var, env);
            if (is_lval(lvalue)) {
                set_lval(lvalue, rvalue, env);
            } else {
                throw new TypeError("Invalid left hand side in assignment.");
            }
            return null;
        case "if_else":
            if (is_truthy(get_rval(eval_expr(stmt.pred, env), env))) {
                const inner_env = new Env(env);
                return eval_stmt(stmt.on_true, inner_env);
            } else {
                const inner_env = new Env(env);
                return eval_stmt(stmt.on_false, inner_env);
            }
        case "while":
            while (is_truthy(get_rval(eval_expr(stmt.pred, env), env))) {
                const inner_env = new Env(env);
                const jmp = eval_stmt(stmt.body, inner_env);
                if (jmp !== null) {
                    if (jmp.tag === "break") break;
                    if (jmp.tag === "continue") continue;
                    if (jmp.tag === "r_ret") return jmp;
                }
            }
            return null;
        case "return":
            if (stmt.val === null) {
                return make_ret(null);
            } else {
                return make_ret(get_rval(eval_expr(stmt.val, env), env));
            }
        case "continue":
            return make_continue();
        case "break":
            return make_break();
        case "block":
            const inner_env = new Env(env);
            return eval_block(stmt, inner_env);
    }
}
// evaluate a code block
function eval_block(block: Block, env: Env): JmpStmt {
    for (const stmt of block.body) {
        const jmp = eval_stmt(stmt, env);
        if (jmp !== null) return jmp;
    }
    return null;
}

// converts a value to string for printing. limiting depth in case array contains itself
function to_string(val: RValue, max_depth: number = 5): string {
    if (max_depth === 0) return "..."; // maximum recursion reached
    if (is_int(val)) return val.val.toString();
    if (is_local(val)) return `fn (${val.lambda.params.map(param => param.name).join(", ")}) { ... }`;
    if (is_builtin(val)) return "{ builtin function }"
    if (is_arr(val)) return `[${val.arr.map(e => to_string(e, max_depth - 1)).join(", ")}]`;
    return "{ error }"; // can't happen
}

// declare the predefined values
function declare_prelude(env: Env, stdout: string[]): void {
    const e_panic = make_builtin(_args => {
        throw new Error("panic!");
    });
    const e_print = make_builtin(args => {
        const str = args.map(e => to_string(e)).join(" ");
        // console.log(str);
        stdout.push(str);
    });
    const e_len = make_builtin(args => {
        enforce_argc(1, args);
        const arr = args[0];
        if (is_arr(arr)) {
            return make_int(arr.arr.length);
        } else throw new TypeError(`Invalid type '${type_err_name(arr)}' in length function.`);
    });
    const e_push = make_builtin(args => {
        enforce_argc(2, args);
        const arg = args[0];
        const val = args[1];
        if (is_arr(arg)) {
            arg.arr.push(val);
        } else throw new TypeError(`Invalid type '${type_err_name(arg)}' in push function.`);
    });
    const e_pop = make_builtin(args => {
        enforce_argc(1, args);
        const arg = args[0];
        if (is_arr(arg)) {
            if (arg.arr.length > 0) {
                return arg.arr.pop();
            } else {
                throw new RangeError("Cannot pop empty array.");
            }
        } else throw new TypeError(`Invalid type '${type_err_name(arg)}' in pop function.`);
    });
    const e_is_int = make_builtin(args => {
        enforce_argc(1, args);
        const arg = args[0];
        return make_int(is_int(arg) ? 1 : 0);
    });
    const e_is_arr = make_builtin(args => {
        enforce_argc(1, args);
        const arg = args[0];
        return make_int(is_arr(arg) ? 1 : 0);
    });
    const e_is_fun = make_builtin(args => {
        enforce_argc(1, args);
        const arg = args[0];
        return make_int(is_fun(arg) ? 1 : 0);
    });

    env.declare("true", make_int(1));
    env.declare("false", make_int(0));
    env.declare("panic", e_panic);
    env.declare("print", e_print);
    env.declare("len", e_len);
    env.declare("push", e_push);
    env.declare("pop", e_pop);
    env.declare("is_int", e_is_int);
    env.declare("is_arr", e_is_arr);
    env.declare("is_fun", e_is_fun);
}

/**
 * Evaluates a program and throws an error if it is invalid.
 * @param program The program string
 * @param stdout An array the program will print to
 * @param prelude A map of values that will be predefined to the program
 * @returns The main function of the program
 */
export function evaluate(
    program: string,
    stdout: string[] | null = null,
    prelude: Map<string, RValue> | null = null
): (...args: RValue[]) => RValue {

    const env = new Env(null); // base frame without parent
    if (stdout === null) stdout = []; // create new stdout if none was specified
    declare_prelude(env, stdout);
    // add extra predefined values if specified
    if (prelude !== null) prelude.forEach((rval, name) => env.declare(name, rval));

    // evaluate code
    const program_env = new Env(env);
    const block = parse(tokenize(program));
    eval_block(block, program_env);

    // return main function
    const main = program_env.get("main");
    if (is_local(main)) {
        return (...args) => eval_call(main, args);
    } else throw new TypeError("'main' must be a function.");
}

/**
 * Evaluates a program with extra predefined values that can be used to create a maze solving algorithm.
 * Throws an error if the program is invalid.
 * @param program The program string
 * @returns A pair of the created maze solving function and the array the program will print to.
 */
export function evaluate_solver(program: string): [MazeSolver, string[]] {
    const stdout: string[] = [];
    const solver = solver_wrapper((
        goal,
        cur,
        in_bound,
        lookup,
        move
    ) => {
        // more predefined values
        const e_get_x = make_builtin(args => {
            enforce_argc(0, args);
            return make_int(cur().x);
        });
        const e_get_y = make_builtin(args => {
            enforce_argc(0, args);
            return make_int(cur().y);
        });
        const e_in_bound = make_builtin(args => {
            enforce_argc(2, args);
            const x = args[0];
            const y = args[1];
            if (is_int(x) && is_int(y)) {
                return make_int(in_bound(make_pos(x.val, y.val)) ? 1 : 0);
            } else throw new TypeError(`Invalid types '${type_err_name(x)}', '${type_err_name(y)}' in in_bound function.`);
        });
        const e_is_wall = make_builtin(args => {
            enforce_argc(2, args);
            const x = args[0];
            const y = args[1];
            if (is_int(x) && is_int(y)) {
                return make_int(is_wall(lookup(make_pos(x.val, y.val))) ? 1 : 0);
            } else throw new TypeError(`Invalid types '${type_err_name(x)}', '${type_err_name(y)}' in is_wall function.`);
        });
        const e_move = make_builtin(args => {
            enforce_argc(1, args);
            const dir = args[0];
            if (is_int(dir)) {
                switch (dir.val) {
                    case 0:
                        move("right");
                        break;
                    case 1:
                        move("up");
                        break;
                    case 2:
                        move("left");
                        break;
                    case 3:
                        move("down");
                        break;
                    default: throw new TypeError(`Invalid direction '${dir.val}' in move function.`);
                }
            } else throw new TypeError(`Invalid type '${type_err_name(dir)}' in lookup function.`);
        });

        const prelude = new Map<string, RValue>([
            ["right", make_int(0)],
            ["up", make_int(1)],
            ["left", make_int(2)],
            ["down", make_int(3)],
            ["get_x", e_get_x],
            ["get_y", e_get_y],
            ["in_bound", e_in_bound],
            ["is_wall", e_is_wall],
            ["move", e_move],
        ]);
        const args = [
            make_int(goal.x),
            make_int(goal.y)
        ];

        // evaluate and run the program
        const main = evaluate(program, stdout, prelude);
        main(...args);
    });
    return [solver, stdout];
}
