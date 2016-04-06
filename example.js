var generate = require('escodegen').generate
var lave = require('lave')

var a = [function(){}, new Date, new Buffer('A'), global]
a.splice(2, 0, a)

var js = lave(a, {generate, format: 'module'})
