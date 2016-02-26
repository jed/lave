#!/usr/bin/env node

const assert = require('assert')
const acorn = require('acorn')
const babylon = require('babylon')
const esprima = require('esprima')
const babel = {generate: require('babel-generator')}
const escodegen = require('escodegen')
const lave = require('..')

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

console.log(js)
