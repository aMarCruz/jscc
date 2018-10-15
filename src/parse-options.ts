import { join, relative } from 'path'
import { VARNAME } from './revars'

type JsccValues = {
  [k: string]: any,
  _VERSION: string,
  _FILE: string,
}

// These characters have to be escaped.
const R_ESCAPED = /(?=[-[{()*+?.^$|\\])/g

const defErrorHandler = (message: string) => {
  throw new Error(message)
}

const getPackageVersion = (version?: string) => {
  if (!version || typeof version != 'string') {
    let path = process.cwd().replace(/\\/g, '/')
    version = '?'

    while (~path.indexOf('/')) {
      const pack = join(path, 'package.json')
      try {
        version = require(pack).version
        break
      } catch { /**/ }
      path = path.replace(/\/[^/]*$/, '')
    }
  }
  return version!
}

export default function parseOptions (file: string, opts?: JsccOptions): JsccProps {

  opts = opts || {}

  const errorHandler = typeof opts.errorHandler == 'function'
    ? opts.errorHandler : defErrorHandler

  const srcValues = opts.values || {}
  const values = {} as JsccValues

  if (typeof srcValues != 'object') {
    throw new Error('jscc values must be a plain object')
  }

  // shallow copy of the values, must be set per file
  Object.keys(srcValues).forEach((v) => {
    if (VARNAME.test(v)) {
      values[v] = srcValues[v]
    } else {
      throw new Error(`Invalid memvar name: ${v}`)
    }
  })

  // Set _VERSION once, keep any in the options
  values._VERSION = getPackageVersion(srcValues._VERSION),

  // File is readonly and valid only for this instance
  values._FILE = file && relative(process.cwd(), file).replace(/\\/g, '/') || ''

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

  prefixes = prefixes.length ? (prefixes as string[]).join('|') : '//|/\\*|<!--'

  return {
    keepLines:  !!opts.keepLines,
    mapContent: !!opts.mapContent,
    mapHires:   !!opts.mapHires,
    sourceMap:  opts.sourceMap !== false,
    errorHandler,
    prefixes,
    values,
  }
}
