/**
 * jscc v1.0.0
 *
 * @author aMarCruz
 * @license MIT
 */
import { parseBuffer } from './parse-buffer'
import { parseOptions } from './parse-options'

const isFunction = (fn: any): fn is Function => (!!fn && typeof fn == 'function')

/**
 * Preprocessor for conditional comments and compile-time variable
 * replacement replacement in text files (asynchronous version).
 *
 * @param source String to preprocess, in ascii or utf8 codification.
 * @param filename Absolute or relative to the current directory.
 * @param options User options
 * @param callback Function to receive error and result parameters.
 */
function jscc (
  code: string,
  filename?: string | null,
  options?: Jscc.Options | null,
  callback?: Jscc.Callback
) {
  // Get the normalized options
  const props = parseOptions(filename || '', options || {})

  // Run sync if not callback is given
  if (!isFunction(callback)) {
    return parseBuffer(code, props)
  }

  // With a callback mimic an async behavior
  process.nextTick(() => {
    try {
      const result = parseBuffer(code, props)
      callback(null, result)
    } catch (err) {
      callback(err)
    }
  })
  return undefined
}

export default jscc
