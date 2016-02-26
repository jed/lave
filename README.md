# lave [![Build Status](https://travis-ci.org/jed/lave.svg?branch=master)](https://travis-ci.org/jed/lave)

lave is [eval][] in reverse; it does for JavaScript what [JSON.stringify][] does for JSON, turning an arbitrary object in memory into the code needed to create it.

## Why not just use JSON.stringify?

- JSON can't handle circular references
- JSON can't render most JavaScript objects
- JSON doesn't preserve object identity
- JSON can't be minified
- JSON can't render globals

Type                | JavaScript          | JSON.stringify               | lave
------------------- | ------------------- | ---------------------------- | -------------------------
Circular references | `a={}; a.self=a`    | :x: TypeError                | `var a={};a.self=a;a`
Repeated references | `a={}; [a, a]`      | `[{}, {}]`                   | `var a={};[a,a]`
Global object       | `global`            | :x: TypeError                | `(0,eval)('this')`
Built-in objects    | `Array.prototype`   | `[]`                         | `Array.prototype`
Boxed primitives    | `Object('abc')`     | `"abc"`                      | `Object('abc')`
Functions           | `[function(){}]`    | `[null]`                     | `[function(){}]`
Dates               | `new Date`          | `"2016-02-26T16:00:46.589Z"` | `new Date(1456502446589)`
Sparse arrays       | `a=[]; a[2]=0; a`   | `[null,null,0]`              | `var a=Array(3);a[2]=0`
Object properties   | `a=[0,1]; a.b=2; a` | `[0,1]`                      | `var a=Array(3);a[2]=0`

## How does lave work?

- traverses the global object to capture accessors
- traverses your object to convert it into an abstract syntax tree
- pulls expressions referenced twice or more into variable declarations
- adds statements needed to fulfil circular references

## Installation

    $ npm install lave

## API

### ast = lave(object, [options])

By default, lave takes an object and returns an abstract syntax tree (herein as AST) representing the generated JavaScript.

- `object` (required): The object to be stringified
- `options` (optional): An object with any of the following properties:
  - `generate`: A function that takes an [ESTree][] AST and returns JavaScript code, such as through [escodegen][] or [babel-generator][]. If this is omitted, an AST will be returned, with any functions in the original object serialized using [toString][], and wrapped in an [eval][] call. If this is specified, a JavaScript string will be returned.

[eval]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/eval
[JSON.stringify]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify
[escodegen]: https://github.com/estools/escodegen
[babel-generator]: https://github.com/babel/babel/tree/master/packages/babel-generator
[ESTree]: https://github.com/estree/estree/blob/master/spec.md
[toString]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/toString
