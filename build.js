#!/usr/bin/env node

const options = {entry: 'lave.js'}
const config = {format: 'cjs', dest: 'index.js'}

require('rollup').rollup(options)
  .then(bundle => bundle.write(config))
  .catch(console.log)
