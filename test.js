'use strict'

import {equal} from 'assert'
import escodegen from 'escodegen'
import lave from '.'

const tests = {
  number:    [ 123                           , `123`                                 ],
  negative:  [ -123                          , `-123`                                ],
  string:    [ 'abc'                         , `'abc'`                               ],
  boolean:   [ true                          , `true`                                ],
  Number:    [ new Number(123)               , `Object(123)`                         ],
  String:    [ new String('abc')             , `Object('abc')`                       ],
  Boolean:   [ new Boolean(true)             , `Object(true)`                        ],
  undefined: [ void 0                        , `undefined`                           ],
  null:      [ null                          , `null`                                ],
  NaN:       [ NaN                           , `NaN`                                 ],
  Infinity:  [ Infinity                      , `Infinity`                            ],
  RegExp:    [ /regexp/img                   , `/regexp/gim`                         ],
  Buffer:    [ new Buffer('A')               , `Buffer('QQ==','base64')`             ],
  Date:      [ new Date(1e12)                , `new Date(1000000000000)`             ],
  Function:  [ [function (o){o}]             , `[function (o){o}]`                   ],
  Error:     [ new Error('XXX')              , `new Error('XXX')`                    ],
  Array:     [ [1,2,3]                       , `[1,2,3]`                             ],
  sparse:    [ Array(10)                     , `var a=[];a.length=10;a`              ],
  Set:       [ new Set([1,2,3])              , `new Set([1,2,3])`                    ],
  Map:       [ new Map([[1,2]])              , `new Map([[1,2]])`                    ],
  cycleMap:  [ (a=>a.set(0,a))(new Map)      , `var a=new Map([[0]]);a.set(0,a);a`   ],
  cycleSet:  [ (a=>a.add(a).add(0))(new Set) , `var a=new Set();a.add(a);a.add(0);a` ],
  global:    [ root                          , `(0,eval)('this')`                    ],
  slice:     [ [].slice                      , `Array.prototype.slice`               ],
  arrcycle:  [ (a=>a[0]=a)([])               , `var a=[,];a[0]=a;a`                  ],
  objcycle:  [ (a=>a.a=a)({})                , `var a={'a':null};a.a=a;a`            ],
  dipole:    [ (a=>[a,a])({})                , `var a={};[a,a]`                      ],
  property:  [ Object.assign([], {a:0})      , `var a=[];a.a=0;a`                    ],
  prototype: [ Object.create(null)           , `Object.create(null)`                 ]
}

const format = {compact: true, semicolons: false}
const options = {generate: ast => escodegen.generate(ast, {format})}

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
