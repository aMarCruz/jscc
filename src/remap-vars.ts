/*
  Variable replacement inside the code.
*/
import { VARS_TO_REPL } from './regexes'
import MagicString from 'magic-string'

/**
 * Helper for `JSON.stringify`.
 *
 * It outputs a valid number for non-finite numbers and the source string of
 * regexes because stringify converts `Infinity` and `-Infinity` to `null`
 * and regexes to `{}` (an empty object).
 */
const stringifyFn = (_: string, value: any) => {

  if (typeof value == 'number' && !Number.isFinite(value) && !Number.isNaN(value)) {
    return value > 0 ? Number.MAX_VALUE : Number.MIN_VALUE
  }

  return value instanceof RegExp ? value.source : value
}

/**
 * Stringify the given value using this rules:
 *
 * - undefined   -> 'undefined'
 * - null / NaN  -> 'null'
 * - Infinity    -> 'Infinity'
 * - RegExp      -> JSON.stringify(value.source)
 * - objects     -> JSON.stringify(value) (Date as ISO string or `null`)
 * - primitives  -> String(value)
 *
 * @param value any value, including undefined
 */
const stringifyValue = (value: any) => {

  // `NaN` returns `null`, for consistency with `JSON.stringify`
  // eslint-disable-next-line no-self-compare
  if (value !== value) {
    return 'null'
  }

  // This is a non-null, non-NaN object, array, date, regexp, etc
  if (value && typeof value == 'object') {
    if (value instanceof Date) {
      return value.toISOString()
    }
    if (value instanceof RegExp) {
      return value.source
    }
    return JSON.stringify(value, stringifyFn)
  }

  // This is a primitive value or null or undefined.
  return String(value)
}

/**
 * Returns the value of the property or properties 'props' of 'obj'.
 *
 * @param obj Source object
 * @param props properties in dot notation
 * @throws TypeError if you try to read the prop on a null object.
 */
const getPropsValue = (obj: any, props: string) => {
  const list = props.split('.')

  while (list.length) {
    const prop = list.shift()!

    // the next assignment will raise a TypeError if obj is null or undefined,
    // or convent obj to undefined if obj is a primitive value... it is ok.
    obj = obj[prop]
  }

  return obj
}

/**
 * Replaces jscc memvars with its values in a code fragment and add it to an
 * instance of MagicString.
 *
 * @param magicStr MagicString instance
 * @param values User values
 * @param fragment Fragment of code to replace and add to `magicStr`
 * @param start Offset where the replacement starts in magicStr.
 */
export function remapVars (magicStr: MagicString, values: JsccValues, fragment: string, start: number) {
  let changes = false

  // node.js is async, make local copy of the regex
  const re = new RegExp(VARS_TO_REPL.source, 'g')
  let match = re.exec(fragment)

  // $1 = varname including the prefix '$'
  // $2 = optional property name(s)

  while (match) {
    const vname = match[1].slice(1)    // strip the prefix '$'

    if (vname in values) {
      const props = match[2] && match[2].slice(1)
      const idx = start + match.index
      let value = values[vname]

      // Check for non-null objects first.
      if (props && typeof value == 'object') {
        value = getPropsValue(value, props)
        match[1] = match[0]
      }

      magicStr.overwrite(idx, idx + match[1].length, stringifyValue(value))
      changes = true
    }

    match = re.exec(fragment)
  }

  return changes
}
