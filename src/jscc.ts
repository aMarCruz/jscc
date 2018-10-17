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
  filename: string,
  options?: JsccOptions,
  callback?: JsccCallback
) {
  const props = parseOptions(filename, options)

  if (isFunction(callback)) {
    process.nextTick(() => {
      try {
        const result = parseBuffer(code, filename, props)
        callback(null, result)
      } catch (err) {
        callback(err)
      }
    })
    return undefined
  }

  return parseBuffer(code, filename, props)
}
