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
Circular references | `a={};a.self=a`   | TypeError                    | `const a={};a.self=a;a`
Repeated references | `a={};[a, a]`     | `[{}, {}]`                   | `const a={};[a,a]`
Global object       | `global`          | TypeError                    | `(0,eval)('this')`
Built-in objects    | `Array.prototype` | `[]`                         | `Array.prototype`
Boxed primitives    | `Object('abc')`   | `"abc"`                      | `Object('abc')`
Functions           | `[function(){}]`  | `[null]`                     | `[function(){}]`
Dates               | `new Date`        | `"2016-02-26T16:00:46.589Z"` | `new Date(1456502446589)`
Sparse arrays       | `a=[];a[2]=0;a`   | `[null,null,0]`              | `const a=Array(3);a[2]=0`

## How does lave work?

## Installation

    $ npm install lave

## Example

```javascript
import escodegen from 'escodegen'
import lave from 'lave'

const data = [
  undefined,
  null,
  '123',
  123,
  true,
  /regexp/,
  new String('123'),
  new Buffer('123'),
  new Number(123),
  new Boolean(true),
  new Date,
  function(){},
  new Error('Nope'),
  [1, 2, 3],
  Array(10),
  global,
  [].slice
]

data.push(data)

const options = {format: {compact: true}}
const js = lave(data, {
  generate(ast) { return escodegen.generate(ast, options) }
})
/*
const $0=(0,eval)('this'),$1=new $0.Error('Nope'),$2=$0.Array,$3=[undefined,
null,'123',123,true,/regexp/,new $0.String('123'),new $0.Buffer('MTIz',
'base64'),new $0.Number(123),new $0.Boolean(true),new $0.Date(1456466115720),
function (){},$1,[1,2,3],$2(10),$0,$2.prototype.slice,null];$1stack=undefined;
$3[17]=$3;$3;
*/
```

[eval]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/eval
[JSON.stringify]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify