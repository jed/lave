#!/usr/bin/env node

'use strict'

const equal = require('assert').equal
const generate = require('escodegen').generate
const lave = require('..')

const format = {compact: true, semicolons: false}
const options = {generate: ast => generate(ast, {format})}
const s = object => lave(object, options)

const g = `(0,eval)('this')`

const tests = {
  number:    [ 123               , `123`                               ],
  string:    [ 'abc'             , `'abc'`                             ],
  boolean:   [ true              , `true`                              ],
  Number:    [ new Number(123)   , `new(${g}).Number(123)`             ],
  String:    [ new String('abc') , `new(${g}).String('abc')`           ],
  Boolean:   [ new Boolean(true) , `new(${g}).Boolean(true)`           ],
  undefined: [ void 0            , `undefined`                         ],
  null:      [ null              , `null`                              ],
  RegExp:    [ /regexp/img       , `/regexp/gim`                       ],
  Buffer:    [ new Buffer('A')   , `new(${g}).Buffer('QQ==','base64')` ],
  Date:      [ new Date(1e12)    , `new(${g}).Date(1000000000000)`     ],
  Function:  [ function (o){o}   , `function (o){o}`                   ],
  Error:     [ new Error('XXX')  , `new(${g}).Error('XXX')`            ],
  Array:     [ [1,2,3]           , `[1,2,3]`                           ],
  sparse:    [ Array(10)         , `${g}.Array(10)`                    ],
  global:    [ (0,eval)('this')  , g                                   ],
  slice:     [ [].slice          , `${g}.Array.prototype.slice`        ],
  cycle:     [ (o=>o[0]=o)([])   , `const $0=[null];$0[0]=$0;$0`       ],
  dipole:    [ (o=>[o,o])({})    , 'const $0={};[$0,$0]'               ]
}

for (let i in tests) equal(s(tests[i][0]), tests[i][1], `
  Expected: ${tests[i][1]}
  Actual: ${s(tests[i][0])}
`)
