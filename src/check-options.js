import { VARNAME } from './revars'
import { join } from 'path'

export default function checkOptions (opts) {
  opts = opts || {}

  // These characters have to be escaped.
  const R_ESCAPED = /(?=[-[{()*+?.^$|\\])/g

  const values = opts.values || (opts.values = {})

  if (typeof opts.values != 'object') {
    throw new Error('jscc values must be a plain object')
  }

  // set _VERSION once in the options
  if (values._VERSION == null) {
    let path = process.cwd().replace(/\\/g, '/')
    let pack
    let version = '?'

    while (~path.indexOf('/')) {
      pack = join(path, 'package.json')
      try {
        version = require(pack).version
        break
      } catch (_) { /**/ }
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
  let prefixes = opts.prefixes || ''
  if (prefixes) {
    const list = Array.isArray(prefixes) ? prefixes : [prefixes]
    prefixes = list.map((prefix) => {
      if (prefix instanceof RegExp) {
        return prefix.source
      }
      if (typeof prefix == 'string') {
        return prefix.replace(R_ESCAPED, '\\')
      }
      throw new Error('Option `prefixes` must be an array of strings or regexes')
    })
  }
  opts.prefixes = prefixes.length ? prefixes.join('|') : '//|/\\*|<!--'

  return opts
}
