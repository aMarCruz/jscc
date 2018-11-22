import parseBuffer = require('./parse-buffer')
import parseOptions = require('./parse-options')

import Jscc from '../index'

// tslint:disable-next-line:ban-types
const isFunction = (fn: any): fn is Function => (!!fn && typeof fn === 'function')

/**
 * Preprocessor for conditional comments and compile-time variable
 * replacement replacement in text files (asynchronous version).
 *
 * The result is a plain JS object with a property `code`, a string with the
 * processed source, and a property `map`, with a raw sourcemap object, if
 * required by the `sourcemap` option.
 *
 * If a callback is provided, jscc will operate asynchronously and call the
 * callback with an error object, if any, or `null` in the first parameter
 * and the result in the second.
 *
 * @param source String to preprocess, in ascii or utf8 codification.
 * @param filename Absolute or relative to the current directory.
 * @param options User options
 * @param callback NodeJS style callback that receives the error and result as parameters.
 */
function jscc (
  source: string,
  filename?: string | null | undefined,
  options?: Jscc.Options | null | undefined,
  callback?: Jscc.Callback
) {
  // Get the normalized options
  const props = parseOptions(filename || '', options || {})

  // Run sync if not callback is given
  if (!isFunction(callback)) {
    return parseBuffer(source, props)
  }

  // With a callback mimic an async behavior
  process.nextTick(() => {
    try {
      const result = parseBuffer(source, props)
      callback(null, result)
    } catch (err) {
      callback(err)
    }
  })
  return undefined
}

export = jscc
