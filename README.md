# lave

lave is [eval] in reverse; it takes an arbitrary JavaScript object and returns the JavaScript code needed to recreate it.

## Installation

    $ npm install lave

## Example

```javascript
const escodegen = require('escodegen')
const lave = require('lave')

const options = {format: {compact: true}}
const generate = ast => escodegen.generate(ast, options)

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

const js = lave(data, {generate})
/*
const $0=(0,eval)('this'),$1=new $0.Error('Nope'),$2=$0.Array,$3=[undefined,
null,'123',123,true,/regexp/,new $0.String('123'),new $0.Buffer('MTIz',
'base64'),new $0.Number(123),new $0.Boolean(true),new $0.Date(1456466115720),
function (){},$1,[1,2,3],$2(10),$0,$2.prototype.slice,null];$1stack=undefined;
$3[17]=$3;$3;
*/
```

[eval]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/eval

