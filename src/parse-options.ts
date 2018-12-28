import escapeRegexStr = require('@jsbits/escape-regex-str')
import getPackageVersion = require('@jsbits/get-package-version')
import pathRelative = require('./lib/path-relative')
import R = require('./regexes')

import Jscc from '../index'

interface RawValues { [k: string]: any }

/**
 * Default prefixes, equivalent to `['//', '/*', '<!--']`
 */
const S_DEF_PREFIXES = /\/[/*]|<!--/.source

/**
 * Default error handler to throw an error.
 *
 * @param error Error instance or string with the error
 */
const errorHandler = (error: string | Error) => {
  if (typeof error === 'string') {
    error = new Error(error)
  }
  throw error
}

const enum QUOTES {
  Single = 1,
  Double = 2,
}

/**
 * Get the `escapeQuotes` flags.
 *
 * @param opts User options
 */
const getEscapeQuotes = (opts: Jscc.Options) => {

  switch (opts.escapeQuotes) {
    case 'single':
      return QUOTES.Single
    case 'double':
      return QUOTES.Double
    case 'both':
      return QUOTES.Single | QUOTES.Double
  }

  return 0
}

/**
 * Helper function to convert prefixes to regex sources.
 *
 * If `prefix` is a regex, return its source, if it is a string, return it
 * escaped. Throw an Error if `prefix` is another type.
 *
 * @param prefix String or regex
 */
const parsePrefix = (prefix: any) => {

  if (prefix instanceof RegExp) {
    return prefix.source
  }

  if (typeof prefix === 'string') {
    return escapeRegexStr(prefix)
  }

  return errorHandler('jscc `prefixes` must be an array of strings or regexes')
}

/**
 * Gets the list of prefixes separated by bars.
 *
 * @param opts User options
 */
const getPrefixes = (opts: Jscc.Options) => {
  let prefixes = opts.prefixes || ''

  if (prefixes) {
    const list = Array.isArray(prefixes) ? prefixes : [prefixes]

    // Discard empty prefixes and ensure to get a string from the rest
    prefixes = list.filter(Boolean).map(parsePrefix).join('|')
  }

  return prefixes || S_DEF_PREFIXES
}

/**
 * Make a shallow copy of values, checking its names.
 *
 * @param src User provided values
 */
const copyValues = function (src: RawValues) {

  const keys = Object.keys(src)
  const dest = Object.create(null) as any

  for (let v, i = 0; i < keys.length; i++) {
    v = keys[i]

    if (R.VARNAME.test(v)) {
      dest[v] = src[v]
    } else {
      errorHandler(`Invalid memvar name: ${v}`)
    }
  }

  return dest as Jscc.Values
}

/**
 * Check the user provided values of the source object.
 * If there's no error returns a shallow copy that includes the default
 * values for `_VERSION` and `_FILE`.
 *
 * Throws an Error if any the source object or a varname is invalid.
 *
 * @param filename User provided filename
 * @param srcValues User values
 */
const getValues = (filename: string, srcValues: RawValues) => {

  if (typeof srcValues !== 'object') {
    return errorHandler('jscc values must be a plain object')
  }

  // Get a shallow copy of the values, must be set per file
  const values = copyValues(srcValues)

  // To allow optimization, keep already existing version.
  if (typeof values._VERSION !== 'string') {
    values._VERSION = getPackageVersion()
  }

  // File name is valid only for this instance
  values._FILE = pathRelative(filename)

  return values
}

/**
 * Get the normalized user options.
 *
 * @param opts User options
 */
const parseOptions = function _parseOptions (filename: string, opts: Jscc.Options): JsccProps {

  // Extract the user defined values
  const values = getValues(filename, opts.values || {})

  // Get the prefixes
  const prefixes = getPrefixes(opts)

  // Quotes to escape in strings
  const escapeQuotes = getEscapeQuotes(opts)

  // Create and returns the normalized jscc props, we are done
  return {
    magicStr:   {} as any,  // makes TS happy
    errorHandler,
    escapeQuotes,
    keepLines:  !!opts.keepLines,
    mapContent: !!opts.mapContent,
    mapHires:   opts.mapHires  !== false,
    sourceMap:  opts.sourceMap !== false,
    prefixes,
    values,
  }
}

export = parseOptions
