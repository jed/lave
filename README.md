# lave [![Build Status](https://travis-ci.org/jed/lave.svg?branch=master)](https://travis-ci.org/jed/lave)

lave is [eval][] in reverse; it does for JavaScript what [JSON.stringify][] does for JSON, turning an arbitrary object in memory into the expression, function, or ES6 module needed to create it.

## Why not just use JSON.stringify?

[JSON][] is great data transport, but can only handle a subset of the objects expressible in a JavaScript runtime. This usually results in lossy serializations at best, and `TypeError: Converting circular structure to JSON` at worst. While we can get around such issues by writing JavaScript code to parse this JSON back into the structures we want, now we have to ship that code out of band, which can be a headache.

Instead of writing a parser for a new language that _can_ represent arbitrary JavaScript runtime values, I built lave to use the best language for the job: JavaScript itself. This allows it to handle the following structures that JSON can't.

Type                | JavaScript            | JSON.stringify                         | lave
------------------- | --------------------- | -------------------------------------- | -------------------------
Circular references | `a={}; a.self=a`      | :x: TypeError                          | :white_check_mark: `var a={};a.self=a;a`
Repeated references | `a={}; [a, a]`        | :warning: `[{}, {}]`                   | :white_check_mark: `var a={};[a,a]`
Global object       | `global`              | :x: TypeError                          | :white_check_mark: `(0,eval)('this')` [?][global objects]
Built-in objects    | `Array.prototype`     | :warning: `[]`                         | :white_check_mark: `Array.prototype`
Boxed primitives    | `Object('abc')`       | :warning: `"abc"`                      | :white_check_mark: `Object('abc')`
Functions           | `[function(){}]`      | :warning: `[null]`                     | :white_check_mark: `[function(){}]`
Dates               | `new Date(1e12)`      | :warning: `"2001-09-09T01:46:40.000Z"` | :white_check_mark: `new Date(1000000000000)`
NaN                 | `NaN`                 | :warning: `null`                       | :white_check_mark: `NaN`
Infinity            | `Infinity`            | :warning: `null`                       | :white_check_mark: `Infinity`
Sets and Maps       | `new Set([1,2,3])`    | :warning: `{}`                         | :white_check_mark: `new Set([1,2,3])`
Sparse arrays       | `a=[]; a[2]=0; a`     | :warning: `[null,null,0]`              | :white_check_mark: `var a=[];a[2]=0;a`
Object properties   | `a=[0,1]; a.b=2; a`   | :warning: `[0,1]`                      | :white_check_mark: `var a=[0,1];a.b=2;a`
Custom prototypes   | `Object.create(null)` | :warning: `{}`                         | :white_check_mark: `Object.create(null)`

Keep in mind that there are some things that not even lave can stringify, such as function closures, or built-in native functions.

## Example

This command...

```javascript
node << EOF
  var generate = require('escodegen').generate
  var lave = require('lave')

  var a = [function(){}, new Date, new Buffer('A'), global]
  a.splice(2, 0, a)

  var js = lave(a, {generate, format: 'module'})
  console.log(js)
EOF
```

...outputs the following JavaScript:

```javascript
var a = [
    function (){},
    new Date(1456522677247),
    null,
    Buffer('QQ==', 'base64'),
    (0, eval)('this')
];
a[2] = a;
export default a;
```

## When would I want to use this?

- **To transport relational data.** Since JSON can only represent hierarchical trees, attempts to serialize a graph require you to define a schema and ship code that reifies the relationship between objects at runtime. For example, if you have list of orders and a list of customers, and each order has a `customerId` property, you need to write and ship code that turns this property into one that references the customer object directly.

- **To colocate data and dependent logic.** The past few years have seen a long overdue rethink of common best practices for web developers. From markup and logic in [React components][] to styles and markup in [Radium][], we've improved developer productivity by slicing concerns vertically (many concerns per component) instead of horizontally (many components per concern). Having the ability to ship tightly coupled logic and data in one file means fewer moving parts during deployment.

- **To avoid runtime dependencies.** There are several libraries that give you the ability to serialize and parse graph data, but most of add a parser dependency to your recipients (in the case of JavaScript, usually a browser). Since lave requires only a JavaScript parser, you do not need to incorporate a runtime library to use it. If you prefer the safety of parsing without evaluation and don't mind the dependency, consider using something like [@benjamn][]'s excellent [arson][].

## How does lave work?

lave uses all of the syntax available in JavaScript to build the most concise representation of an object, such as by preferring literals (`[1,2]`) over assignment (`var a=[];a[0]=1;a[1]=2`). Here's how it works:

- lave traverses the global object to cache paths for any host object. So if your structure contains `[].slice`, lave knows that you're looking for `Array.prototype.slice`, and uses that path in its place.

- lave then traverses your object, converting each value that it finds into an abstract syntax graph. It never converts the same object twice; instead it caches all nodes it creates and reuses them any time their corresponding value appears.

- lave then finds all expressions referenced more than once, and for each one, pulls the expression into a variable declaration, and replaces everywhere that it occurs with its corresponding identifier. This process of removing [dipoles][] converts the abstract syntax graph into a serializable abstract syntax tree.

- Finally, lave adds any assignment statements needed to fulfil circular references in your original graph, and then returns the expression corresponding to your original root value.

## Installation

Please run the following command to install lave:

```bash
$ npm install lave
```

The library has been tested on Node 4.x and 5.x.

## API

### ast = lave(object, [options])

By default, lave takes an `object` and returns an abstract syntax tree (AST) representing the generated JavaScript. Any of the following `options` can also be specified:

- `generate`: A function that takes an [ESTree][] AST and returns JavaScript code, such as through [escodegen][] or [babel-generator][]. If this is omitted, an AST will be returned, with any functions in the original object serialized using [toString][], and wrapped in an [eval][] call. If this is specified, a JavaScript string will be returned.
- `format`: A string specifying the type of code to output, from the following:
  - `expression` (default): Returns code in which the last statement is result expression, such as `var a={};[a, a];`. This is useful when the code is evaluated with [eval][].
  - `function`: Returns the code as a function expression, such as `(function(){var a={};return[a, a]})`. This is useful for inlining as an expression without polluting scope.
  - `module`: Returns the code as an ES6 module export, such as `var a={};export default[a, a];`. This is currently useful for integration with a module build process, such as [Rollup][] or [Babel][] transforms.
- `globalRefs`: Whether to search the global scope for references. Set this to `false` when the code will be evaluated in a different context.

## Addenda

- Many thanks to [Jamen Marz][] for graciously providing the `lave` name on npm.
- Right before publishing this, I discovered that [uneval][] was a thing.

[eval]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/eval
[JSON.stringify]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify
[escodegen]: https://github.com/estools/escodegen
[babel-generator]: https://github.com/babel/babel/tree/master/packages/babel-generator
[ESTree]: https://github.com/estree/estree/blob/master/spec.md
[toString]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/toString
[Jamen Marz]: https://github.com/jamen
[Rollup]: http://rollupjs.org
[Babel]: http://babeljs.io/docs/plugins/transform-es2015-modules-commonjs
[dipoles]: https://en.wikipedia.org/wiki/Dipole_graph
[JSON]: http://json.org/
[global objects]: http://perfectionkills.com/unnecessarily-comprehensive-look-into-a-rather-insignificant-issue-of-global-objects-creation/
[React components]: https://facebook.github.io/react/docs/reusable-components.html
[Radium]: https://github.com/FormidableLabs/radium
[@benjamn]: https://github.com/benjamn
[arson]: https://github.com/benjamn/arson
[uneval]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/uneval
