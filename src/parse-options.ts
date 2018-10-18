import { escapeRegex } from './lib/escape-regex'
import { getPackageVersion } from './lib/get-package-version'
import { pathRelative } from './lib/path-relative'
import { VARNAME } from './revars'

const DEF_PREFIX = /\/[/*]|<!--|<!/.source

/**
 * Default error handler throws an error.
 *
 * @param error Error instance or string with the error
 */
const defErrorHandler = (error: string | Error) => {
  if (typeof error == 'string') {
    error = new Error(error)
  }
  throw error
}

/**
 * Get the normalized user options.
 *
 * @param file Name of the file to process
 * @param opts User options
 */
export function parseOptions (file: string, opts?: JsccOptions): JsccProps {
  opts = opts || {}

  const errorHandler = defErrorHandler

  // Extract the user defined values ----------------------------------------

  const srcValues = opts.values || {}
  const values = {} as JsccValues

  if (typeof srcValues != 'object') {
    return errorHandler('jscc values must be a plain object')
  }

  // Get a shallow copy of the values, must be set per file
  Object.keys(srcValues).forEach((v) => {
    if (VARNAME.test(v)) {
      values[v] = srcValues[v]
    } else {
      errorHandler(`Invalid memvar name: ${v}`)
    }
  })

  // File name is valid only for this instance
  values._FILE = pathRelative(file)

  // Set _VERSION once, keep any already existing
  values._VERSION = getPackageVersion(srcValues._VERSION)

  // Extract the prefixes ---------------------------------------------------

  let prefixes = opts.prefixes || ''
  if (prefixes) {
    const list = Array.isArray(prefixes) ? prefixes : [prefixes]

    // Discard empty prefixes and ensure to get a string from the rest
    prefixes = list.filter(Boolean).map((prefix) => {
      if (prefix instanceof RegExp) {
        return prefix.source
      }
      if (typeof prefix == 'string') {
        return escapeRegex(prefix)
      }
      return errorHandler('jscc `prefixes` must be an array of strings or regexes')
    })
  }

  prefixes = prefixes.length ? (prefixes as string[]).join('|') : DEF_PREFIX

  // Create and returns the normalized jscc props, we are done
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
