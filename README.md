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
const $0=(0,eval)('this'),$1=new $0.Buffer('MTIz','base64'),$2=new $0.Error('Nope'),$3=$0.Array,$4=[undefined,null,'123',123,true,/regexp/,new $0.String('123'),$1,new $0.Number(123),new $0.Boolean(true),new $0.Date(1456465549204),function (){},$2,[1,2,3],$3(10),$0,$3.prototype.slice,null];$1[0]=49;$1[1]=50;$1[2]=51;$2.stack=undefined;$4[17]=$4;$4;
*/
```

[eval]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/eval

