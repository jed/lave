'use strict'

import builtins from './builtins.js'

var nativeCode = String(Object).match(/{.*/)[0]
function isNativeFunction(fn) {
  let source = String(fn)
  let index = source.indexOf(nativeCode)
  if (index < 0) return false

  let length = index + nativeCode.length
  return length === source.length
}

function Identifiers() { this.id = 0 }
Identifiers.prototype.next = function() {
  var id = (this.id++).toString(36)
  try { Function(`var ${id}`); return id }
  catch (e) { return this.next() }
}

export default function(value, options) {
  if (!options) options = {}

  var expressions = new Map(builtins)
  var functions = new Set
  var placeholder = Math.random().toString(36).replace(/../, '_')
  var functionPattern = RegExp(`${placeholder}(\\d+)`, 'g')
  var statements = []
  var valueExpression = expression(value)

  var statement = {}
  switch (options.format || 'expression') {
    case 'expression':
      statement.type = 'ExpressionStatement'
      statement.expression = valueExpression
      break

    case 'module':
      statement.type = 'ExportDefaultDeclaration'
      statement.declaration = valueExpression
      break

    case 'function':
      statement.type = 'ReturnStatement'
      statement.argument = valueExpression
      break

    default:
      throw new Error(`Unsupported format: ${options.format}`)
  }

  statements.push(statement)

  var declarationList = declarations(statements)
  if (declarationList.length > 0) statements.unshift({
    type: 'VariableDeclaration',
    declarations: declarationList,
    kind: 'var'
  })

  if (options.format == 'function') {
    statements = [{
      type: 'ExpressionStatement',
      expression: {
        type: 'FunctionExpression',
        body: {
          type: 'BlockStatement',
          body: statements.splice(0)
        },
        params: []
      }
    }]
  }

  var program = {type: 'Program', body: statements}
  if (!options.generate) return program

  var code = generate(program)
  return code.replace(functionPattern, (_, i) => Array.from(functions)[i])

  function declarations(statements) {
    var sites = new Map

    statements.forEach(function crawl(value, key, object) {
      if (Object(value) !== value) return

      let valueSites = sites.get(value)
      if (valueSites) return valueSites.push({object, key})

      sites.set(value, [{object, key}])

      for (let property in value) {
        crawl(value[property], property, value)
      }
    })

    let declarations = Array.from(sites)
      .filter(entry => entry[1].length > 1)
      .map((entry, index) => {
        let id = {type: 'Identifier'}
        for (let site of entry[1]) site.object[site.key] = id

        return {type: 'VariableDeclarator', id, init: entry[0]}
      })

    let ids = new Identifiers
    declarations
      .sort((a, b) => has(a.init, b.id) - has(b.init, a.id))
      .forEach(declaration => declaration.id.name = ids.next())

    return declarations
  }

  function has(parent, child) {
    if (parent === child) return true

    if (Object(parent) !== parent) return false

    for (let key in parent) {
      if (has(parent[key], child)) return true
    }

    return false
  }

  function expression(value) {
    switch (typeof value) {
      case 'undefined':
        return {type: 'Identifier', name: 'undefined'}

      case 'object': if (value !== null) break
      case 'string':
      case 'boolean':
        return {type: 'Literal', value}
      case 'number': return isFinite(value)
        ? {type: 'Literal', value}
        : {type: 'Identifier', name: 'Infinity'}
    }

    if (expressions.has(value)) return expressions.get(value)

    var object = {}
    expressions.set(value, object)

    var names = Object.getOwnPropertyNames(value)
    if (value instanceof String ||
        value instanceof Buffer) names.splice(0, value.length)

    var descriptors = new Map(names.map(name =>
      [name, Object.getOwnPropertyDescriptor(value, name)]
    ))

    var proto = Object.getPrototypeOf(value)
    switch (proto) {
      case String.prototype: descriptors.delete('length')
      case Number.prototype:
      case Boolean.prototype:
        object.type = 'CallExpression'
        object.callee = expression(Object)
        object.arguments = [expression(value.valueOf())]
        break

      case Date.prototype:
        object.type = 'NewExpression'
        object.callee = expression(value.constructor)
        object.arguments = [expression(value.valueOf())]
        break

      case RegExp.prototype:
        descriptors.delete('source')
        descriptors.delete('global')
        descriptors.delete('ignoreCase')
        descriptors.delete('multiline')
        descriptors.delete('lastIndex')
        object.type = 'Literal'
        object.value = value
        break

      case Buffer.prototype:
        object.type = 'NewExpression'
        object.callee = expression(Buffer)
        object.arguments = [value.toString("base64"), "base64"].map(expression)
        break

      case Function.prototype:
        if (isNativeFunction(value)) {
          throw new Error('Native code cannot be serialized.')
        }

        descriptors.delete('length')
        descriptors.delete('name')
        descriptors.delete('arguments')
        descriptors.delete('caller')
        descriptors.delete('prototype')

        if (!options.generate) {
          object.type = 'CallExpression'
          object.callee = expression(eval)
          object.arguments = [expression(String(value))]
          break
        }

        functions.add(value)
        let index = Array.from(functions).indexOf(value)
        object.type = 'Identifier'
        object.name = placeholder + index
        break

      case Error.prototype:
      case EvalError.prototype:
      case RangeError.prototype:
      case ReferenceError.prototype:
      case SyntaxError.prototype:
      case TypeError.prototype:
      case URIError.prototype:
        descriptors.delete('message')
        descriptors.delete('stack')

        object.type = 'NewExpression'
        object.callee = expression(value.constructor)
        object.arguments = [expression(value.message)]
        break

      case Array.prototype:
        descriptors.delete('length')

        if (value.filter(x => true).length < value.length) {
          object.type = 'CallExpression'
          object.callee = expression(value.constructor)
          object.arguments = [expression(value.length)]
        }

        else {
          object.type = 'ArrayExpression'
          object.elements = value.map((item, index) => {
            let element = expression(item)

            if (element === object) element = expression(null)
            else descriptors.delete(String(index))

            return element
          })
        }

        break

      case Object.prototype:
        object.type = 'ObjectExpression'
        object.properties = []

        for (let pair of descriptors) {
          // handle method / getter / setter shorthand
          descriptors.delete(pair[0])
          object.properties.push({
            type: 'Property',
            key: expression(pair[0]),
            value: expression(pair[1].value)
          })
        }

        break

      default:
        object.type = 'CallExpression'
        object.callee = expression(Object.create)
        object.arguments = [expression(proto)]
        break
    }

    for (let pair of descriptors) {
      let computed = !isNaN(pair[0])
      let property = computed
        ? expression(Number(pair[0]))
        : {type: 'Identifier', name: pair[0]}

      statements.push({
        type: 'ExpressionStatement',
        expression: {
          type: 'AssignmentExpression',
          operator: '=',
          left: {type: 'MemberExpression', computed, object, property},
          right: expression(pair[1].value)
        }
      })
    }

    return object
  }
}
