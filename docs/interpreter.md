# aMazing-language Specifications

## Tokens

### Whitespace

Whitespace includes space, tab and new line and can be used to separate tokens. Excessive whitespace and any form of indentation is ignored.

### Comments

The first `#` character in a line and all characters after it until the next new line or end of input is ignored.

#### Example

    var x = 2; # this is a declaration
    #abc # var var var ?.?

### Naming Rules

A variable name is case sensitive and must start with a letter a-z or A-Z or an underscore and every following character must be a letter a-z or A-Z, an underscore or a digit 0-9. A variables cannot share a name with any of the reserved keywords.

#### Example

    x
    _x
    x1
    _123

### Integers

An integer literal is case insensitive must start with a digit 0-9 and every following character must be a letter a-z or A-Z, an underscore or a digit 0-9. Underscores are ignored for purposes of determining its value.

If it begins with `0b` it is a binary integer and can only contain binary digits. At least one non-underscore character must follow.

If it begins with `0x` it is a hexadecimal integer and can only contain hexadecimal digits. At least one non-underscore character must follow.

Otherwise it is a decimal integer and can only contain decimal digits.

#### Example

    1234 → 1234
    1_234 → 1234
    0x1f → 31
    0x_1__f_ → 31
    0b01010 → 10
    0b1_010 → 10

### Reserved Keywords

* `var`
* `fn`
* `if`
* `else`
* `while`
* `return`
* `continue`
* `break`

### Operators

#### Unary Postfix Operators

All unary postfix operators have the same precedence which is higher than all unary prefix operators. All unary postfix operators are left-to-right associative.

* `()` - Function call
* `[]` - Array subscripting

#### Unary Prefix Operators

All unary prefix operators have the same precedence which is higher than all binary operators. All unary prefix operators are right-to-left associative.

* `!` - Logical NOT
* `+` - Unary plus
* `-` - Unary minus

#### Binary Operators

Binary operators are listed top to bottom in descending precedence. Operators on the same line have the same precedence. All binary operators are left-to-right associative.

* `*` `/` `%` - Multiplication, division and modulo
* `+` `-` - Addition and subtraction
* `<` `<=` `>` `>=` - The common relational operators
* `==` `!=` - Equality and inequality
* `&&` - Logical AND
* `||` - Logical OR

#### Example

    x[y]() → (x[y])()
    !-x → !(-x)

    x + y * z → x + (y * z)
    x + y - z → (x + y) - z
    x && y || z → (x && y) || z

    -x[y] → -(x[y])
    -x + -y → (-x) + (-y)
    x() + y[z] → (x()) + (y[z])

### Other Symbols

All symbols (including operators) are parsed greedily, not ending a symbol before it would become invalid or encounters whitespace.

* `(` `)` - Overriding precedence
* `{` `}` - Grouping statements
* `[` `]` - Creating arrays
* `=` - Declaration and assignment
* `,` - Separating array elements, function parameters and function arguments
* `;` - End statement

#### Example

    === → == =
    =!= → = !=
    |||| → || ||

## Syntax

### Expressions

Expressions must be of one of the following forms.

* *name* - Variable name
* *integer* - Integer literal
* `(` *expression* `)` - Overriding precedence
* `[` *expression* `,` ... `]` - Array literal
* `fn` `(` *name* `,` ... `)` `{` *statement* ... `}` - Function literal
* *expression* `(` *expression* `,` ... `)` - Function call
* *expression* `[` *expression* `]` -  Array subscripting
* *unary-prefix-operator* *expression* - Unary prefix operator
* *expression* *binary-operator* *expression* - Binary operator

#### Example

    [1, 2, 3] + [x, y, z]
    fn () {}
    (fn (x, y) { return x + y; })()
    -x[y]
    1 * (1 + 1)

### Statements

Statements must be of one of the following forms.

* `;` - No operation
* *expression* `;` - Expression, ignoring result
* `var` *name* `=` *expression* `;` - Variable declaration
* *expression* `=` *expression* `;` - Variable assignment
* `if` `(` *expression* `)` *statement* - Conditional
* `if` `(` *expression* `)` *statement* `else` *statement* - Conditional
* `while` `(` *expression* `)` *statement* - Loop
* `return` `;` - Return
* `return` *expression* `;` - Return value
* `continue` `;` - Continue loop
* `break` `;` - Break loop
* `{` *statement* ... `}` - Code block

#### Example

    var x = 1;
    x = 2;
    if (x) return x; else if (y) continue; else { if (z) break; }
    while (f(x));
    { var x = 1; x = 2; }

## Types

There are three types: integer, array and function. Variables, elements, parameters and return values do not have types associated with them and can store, accept and return different types than they did originally. No two values of different types are equal.

### Integer

An integer stores a whole number. Two integers are equal if they represent the same number.

### Array

An array stores a reference to an ordered list of elements that can be of different types. Elements can be modified, added or removed from the list and all arrays storing the same reference will observe the effect. Two arrays are equal if they store the same reference.

### Function

A function stores a reference to an object that can be called with a list of ordered values that can be of different types as its arguments to return a value of any type. Two functions are equal if they store the same reference.

## Environment

The first frame created which points to nothing contains all predefined values. This is what the program frame, where the user written code runs, points to. After executing, the program frame must contain a variable named `main` that stores a function. The number and types of the arguments this function is called with will depend on the implementation.

### Creation

When a statement inside a conditional, loop or code block is executed, it will do so inside a newly created frame pointing to the frame the condition, loop or code block was executed inside. Additionally a function object will store what frame it was created in and when called, the body will be executed in a new frame pointing to the one stored in the function object. The function body is executed in the same frame that the parameters were declared in.

### Usage

When reading or assigning to a variable, the name will be search for within the current frame and if it has not been declared, it will recursively search the frame it points to. If it has not been declared and it does not point to anything, an error is thrown. When declaring a variable, if the name has not been declared in the current frame, it will be, otherwise an error is thrown. Note that if a variable is read or assigned to but would be declared later in the same scope, the reading or assigning will still search the frame pointed to.

#### Example

    var x = 1;
    {
        print(x); # 1
        x = 3;
        var x = 2;
        print(x); # 2
    }
    print(x) # 3

## Semantics

### Truth value

An integer is truthy if it is not 0. An array is truthy if its length is not 0. A function is always truthy.

### Operators

#### `f(x)` - Function call

Takes a function as its primary operand and optionally a list of values between the parenthesis as arguments to the function. Returns a value.

#### `a[i]` - Array subscripting

Takes an array as its primary operand and an integer between the brackets to use as index. The index must be between 0 (inclusive) and the length of the array (exclusive) where 0 corresponds to the first element in the array. Returns the value stored at that index which can be assigned to.

#### `!x` - Logical NOT

Takes a value as operand and returns 0 if its truthy and 1 otherwise.

#### `+i` - Unary plus

Takes an integer and returns the same integer.

#### `-i` - Unary minus

Takes an integer and returns its negation.

#### `i*i` - Multiplication

Takes two integers and returns their product.

#### `i/i` - Division

Takes two integers and returns the floor of their quotient. If the right operand is 0 an exception is thrown.

#### `i%i` - Modulo

Takes two integers and returns the integer a-b·⌊a/b⌋ where a is the left operand and b the right operand. If the right operand is 0 an exception is thrown.

#### `x+x` - Addition / Concatenation

Takes two integers or two arrays. If they are integers it returns their sum. If they are arrays it returns a new array containing all the elements in the left operand followed by all the elements in the right operand.

#### `i-i` - Subtraction

Takes two integers and returns their difference.

#### `i<i` - Less than

Takes two integers and returns 1 if the left operand is less than the right operand or 0 otherwise.

#### `i<=i` - Less than or equal to

Takes two integers and returns 1 if the left operand is less than or equal to the right operand or 0 otherwise.

#### `i>i` - Greater than

Takes two integers and returns 1 if the left operand is greater than the right operand or 0 otherwise.

#### `i>=i` - Greater than or equal to

Takes two integers and returns 1 if the left operand is greater than or equal to the right operand or 0 otherwise.

#### `x==x` - Equality

Takes two values and returns 1 if they are equal or 0 otherwise.

#### `x!=x` - Inequality

Takes two values and returns 0 if they are equal or 1 otherwise.

#### `x&&x` - Logical AND

Evaluates the left operand and returns it if it is not truthy. Otherwise it evaluates the right operand and returns it.

#### `x||x` - Logical NOT

Evaluates the left operand and returns it if it is truthy. Otherwise it evaluates the right operand and returns it.

### Statements

### Functions

### Predefined values
