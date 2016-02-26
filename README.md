# lave

lave is [eval][] in reverse; it does for JavaScript what [JSON.stringify][] does for JSON, turning an arbitrary object in memory into the code needed to create it.

## Why not just use JSON.stringify?

- JSON can't handle circular references
- JSON can't render most JavaScript objects
- JSON doesn't preserve object identity
- JSON can't be minified
- JSON can't render globals

Type                | JavaScript        | JSON.stringify               | lave
------------------- | ----------------- | ---------------------------- | -------------------------
Circular references | `a={};a.self=a`   | TypeError                    | `var a={};a.self=a;a`
Repeated references | `a={};[a, a]`     | `[{}, {}]`                   | `var a={};[a,a]`
Global object       | `global`          | TypeError                    | `(0,eval)('this')`
Built-in objects    | `Array.prototype` | `[]`                         | `Array.prototype`
Boxed primitives    | `Object('abc')`   | `"abc"`                      | `Object('abc')`
Functions           | `[function(){}]`  | `[null]`                     | `[function(){}]`
Dates               | `new Date`        | `"2016-02-26T16:00:46.589Z"` | `new Date(1456502446589)`
Sparse arrays       | `a=[];a[2]=0;a`   | `[null,null,0]`              | `var a=Array(3);a[2]=0`
Object properties   | `a=[0,1];a.b=2;a` | `[0,1]`                      | `var a=Array(3);a[2]=0`

## How does lave work?

- traverses the global object to capture accessors
- traverses your object to convert it into an abstract syntax tree
- pulls expressions references more than once into variable declarations
- adds statements needed to fulfil circular references

## Installation

    $ npm install lave

[eval]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/eval
[JSON.stringify]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify