/**
 * jscc v1.0.0
 *
 * @author aMarCruz
 * @license MIT
 */
import { parseBuffer } from './parse-buffer'
import { parseOptions } from './parse-options'

const isFunction = (fn: any): fn is Function => (!!fn && typeof fn == 'function')

export default function jscc (
  code: string,
  filename?: string | null,
  options?: JsccOptions,
  callback?: JsccCallback
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

