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

  Object.keys(opts.values).forEach(v => {
    if (!VARNAME.test(v)) {
      throw new Error(`Invalid memvar name: ${v}`)
    }
  })

  // sequence starting a directive, default is `//|/*` (JS comment)
  const prefixes = opts.prefixes
  if (!prefixes) {
    opts.prefixes = ['//', '/*', '<!--']
  } else if (typeof prefixes == 'string') {
    opts.prefixes = [prefixes]
  } else if (!Array.isArray(prefixes)) {
    throw new Error('`prefixes` must be an array')
  }

  return opts
}
