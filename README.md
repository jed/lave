# lave [![Build Status](https://travis-ci.org/jed/lave.svg?branch=master)](https://travis-ci.org/jed/lave)

lave is [eval][] in reverse; it does for JavaScript what [JSON.stringify][] does for JSON, turning an arbitrary object in memory into the code needed to create it.

## Why not just use JSON.stringify?

JSON is great data transport, but can only handle a subset of the objects expressible in a JavaScript runtime. This usually results in lossy serializations at best, and `TypeError: Converting circular structure to JSON` at worst. While we can get around such issues by writing JavaScript code to parse this JSON back into the structures we want, now we have to ship that code out of band, which can be a headache.

Instead of writing a parser for a new language that _can_ represent arbitrary JavaScript runtime values, I built lave to use the best language for the job: JavaScript itself. This allows it to handle the following structures that JSON can't.

Type                | JavaScript          | JSON.stringify               | lave
------------------- | ------------------- | ---------------------------- | -------------------------
Circular references | `a={}; a.self=a`    | :x: TypeError                | `var a={};a.self=a;a`
Repeated references | `a={}; [a, a]`      | `[{}, {}]`                   | `var a={};[a,a]`
Global object       | `global`            | :x: TypeError                | `(0,eval)('this')`
Built-in objects    | `Array.prototype`   | `[]`                         | `Array.prototype`
Boxed primitives    | `Object('abc')`     | `"abc"`                      | `Object('abc')`
Functions           | `[function(){}]`    | `[null]`                     | `[function(){}]`
Dates               | `new Date`          | `"2016-02-26T16:00:46.589Z"` | `new Date(1456502446589)`
Sparse arrays       | `a=[]; a[2]=0; a`   | `[null,null,0]`              | `var a=Array(3);a[2]=0;a`
Object properties   | `a=[0,1]; a.b=2; a` | `[0,1]`                      | `var a=[0,1];a.b=2;a`

## How does lave work?

lave attempts to build the most concise representation of an object, using all the syntax available in JavaScript. It does this in the following order:

- lave traverses the global object to cache paths for any host object. So if your structure contains `[].slice`, lave knows that you're looking for `Array.prototype.slice`, and uses that path in its place.

- lave then traverses your object, converting each value that it finds into an abstract syntax graph. It never converts the same object twice; instead it caches all nodes it creates and reuses them any time their corresponding value appears.

- lave then finds all expressions referenced more than once, and for each one, pulls the expression into a variable declaration, and replaces everywhere that it occurs with its corresponding identifier, converting the abstract syntax graph into a serializable abstract syntax tree.

- finally, lave adds any assignment statements needed to fulfil circular references in your original graph, and then returns the expression corresponding to your original root value.

## Example

Running the following file...

```javascript
var escodegen = require('escodegen')
var lave = require('lave')

var a = [function(){}, new Date, new Buffer('A'), global]
a.splice(2, 0, a)

var js = lave(a, escodegen.generate)
console.log(js)
```

...will output the following JavaScript:

```javascript
var a = [
    function (){},
    new Date(1456522677247),
    null,
    new Buffer('QQ==', 'base64'),
    (0, eval)('this')
];
a[2] = a;
a;
```

## Installation

    $ npm install lave

## API

### ast = lave(object, [options])

By default, lave takes an object and returns an abstract syntax tree (herein as AST) representing the generated JavaScript.

- `object` (required): The object to be stringified
- `options` (optional): An object with any of the following properties:
  - `generate`: A function that takes an [ESTree][] AST and returns JavaScript code, such as through [escodegen][] or [babel-generator][]. If this is omitted, an AST will be returned, with any functions in the original object serialized using [toString][], and wrapped in an [eval][] call. If this is specified, a JavaScript string will be returned.

---

- Many thanks to [Jamen Marz][] for graciously providing the `lave` name on npm.

[eval]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/eval
[JSON.stringify]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify
[escodegen]: https://github.com/estools/escodegen
[babel-generator]: https://github.com/babel/babel/tree/master/packages/babel-generator
[ESTree]: https://github.com/estree/estree/blob/master/spec.md
[toString]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/toString
[Jamen Marz]: https://github.com/jamen
