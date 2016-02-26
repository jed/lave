'use strict'

const builtins = new Map
const global = (0, eval)('this')

builtins.set(global, {
  type: 'CallExpression',
  callee: {
    type: 'SequenceExpression',
    expressions: [
      {type: 'Literal', value: 0},
      {type: 'Identifier', name: 'eval'}
    ]
  },
  arguments: [{type: 'Literal', value: 'this'}]
})

crawl(global)

export default builtins

function crawl(value, object) {
  let names = Object.getOwnPropertyNames(value)
  let properties = []

  for (let name of names) {
    let descriptor = Object.getOwnPropertyDescriptor(value, name)

    if (Object(descriptor.value) !== descriptor.value) continue
    if (builtins.has(descriptor.value)) continue

    let property = {type: 'Identifier', name}
    if (object) property = {type: 'MemberExpression', object, property}

    builtins.set(descriptor.value, property)

    properties.push({value: descriptor.value, object: property})
  }

  for (let property of properties) crawl(property.value, property.object)
}
