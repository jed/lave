'use strict'

import {equal} from 'assert'
import escodegen from 'escodegen'
import lave from '.'

const tests = {
  number:    [ 123                , `123`                               ],
  string:    [ 'abc'              , `'abc'`                             ],
  boolean:   [ true               , `true`                              ],
  Number:    [ new Number(123)    , `Object(123)`                       ],
  String:    [ new String('abc')  , `Object('abc')`                     ],
  Boolean:   [ new Boolean(true)  , `Object(true)`                      ],
  undefined: [ void 0             , `undefined`                         ],
  null:      [ null               , `null`                              ],
  RegExp:    [ /regexp/img        , `/regexp/gim`                       ],
  Buffer:    [ new Buffer('A')    , `new Buffer('QQ==','base64')`       ],
  Date:      [ new Date(1e12)     , `new Date(1000000000000)`           ],
  Function:  [ [function (o){o}]  , `[function (o){o}]`                 ],
  Error:     [ new Error('XXX')   , `new Error('XXX')`                  ],
  Array:     [ [1,2,3]            , `[1,2,3]`                           ],
  sparse:    [ Array(10)          , `Array(10)`                         ],
  global:    [ root               , `(0,eval)('this')`                  ],
  slice:     [ [].slice           , `Array.prototype.slice`             ],
  cycle:     [ (a=>a[0]=a)([])    , `var a=[null];a[0]=a;a`             ],
  dipole:    [ (a=>[a,a])({})     , `var a={};[a,a]`                    ]
}

const format = {compact: true, semicolons: false}
const generate = ast => escodegen.generate(ast, {format})
const options = {generate}

for (let name in tests) {
  let expected = tests[name][1]
  let actual = lave(tests[name][0], options)

  equal(actual, expected, `
    expected ${name}: ${expected}
    actual ${name}: ${actual}
  `)
}

options.format = 'module'
equal(lave(1, options), 'export default 1')

options.format = 'function'
equal(lave(1, options), '(function(){return 1})')
