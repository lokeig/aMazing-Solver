# Language Documentation for the Interpreter

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
* `{` *statement* ... `}` - Multiple statements

#### Example

    var x = 1;
    x = 2;
    if (x) return x; else if (y) continue; else { if (z) break; }
    while (f(x));
    { var x = 1; x = 2; }

## Types

There are three types: integer, array and function. Variables, elements, parameters and return values do not have types associated with them and can store, accept and return different types than they did originally.

### Integer

An integer stores a whole number. Two integers are equal if they represent the same number.

### Array

An array stores a reference to an ordered list of elements that can be of different types. Elements can be modified, added or removed from the list and all arrays storing the same reference will observe the effect. Two arrays are equal if they store the same reference.

### Function

A function stores a reference to an object that can be called with a list of ordered values that can be of different types as its arguments to return a value of any type. Two functions are equal if they store the same reference.
