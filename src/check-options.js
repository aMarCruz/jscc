import { VARNAME } from './revars'
import { join } from 'path'

export default function checkOptions (opts) {
  if (!opts) opts = {}

  const values = opts.values || (opts.values = {})

  if (typeof opts.values != 'object') {
    throw new Error('jscc values must be a plain object')
  }

  // set _VERSION once in the options
  if (values._VERSION == null) {
    let path = process.cwd().replace(/\\/g, '/')
    let pack, version = '?'

    while (~path.indexOf('/')) {
      pack = join(path, 'package.json')
      try {
        version = require(pack).version
        break
      } catch (_) {/**/}
      path = path.replace(/\/[^/]*$/, '')
    }
    values._VERSION = version
  }

  Object.keys(opts.values).forEach((v) => {
    if (!VARNAME.test(v)) {
      throw new Error(`Invalid memvar name: ${v}`)
    }
  })

  // sequence starting a directive
  let prefixes = opts.prefixes
  if (!prefixes) {
    prefixes = [/^\/\/[ \t]*$/, /^\/\*[ \t]*$/, /^<!--[ \t]*$/]
  } else {
    if (!Array.isArray(prefixes)) {
      prefixes = [prefixes]
    }
    prefixes.some(prefix => {
      if (!prefix || !(typeof prefix == 'string' || prefix instanceof RegExp)) {
        throw new Error('`prefixes` must be an array that each value must be an String or RegExp')
      }
      return prefix
    })
  }
  opts.prefixes = prefixes

  return opts
}
