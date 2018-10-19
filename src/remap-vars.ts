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

  if (value && typeof value == 'object') {

    // This is a non-null, non-NaN object, array, date, regexp, etc
    if (value instanceof Date) {
      value = value.toISOString()

    } else if (value instanceof RegExp) {
      value = value.source

    } else {
      value = JSON.stringify(value, stringifyFn)
    }

  } else {
    // This is a primitive value or null or undefined.
    value = String(value)
  }

  return value
}

/**
 * Returns the given value or the property value if this is an object
 * and the replaced string has a property list.
 *
 * @param value Source value or object
 * @param match Contain the property in $2
 * @throws TypeError if you try to read the prop on a null object.
 */
const getValue = (value: any, match: RegExpExecArray) => {

  // Check object properties
  const propPath = match[2] && match[2].slice(1)

  // Replace with the property value only if this is an aobject
  if (propPath && typeof value == 'object') {
    const props = propPath.split('.')

    while (props.length) {
      const prop = props.shift()!

      // the next assignment will raise a TypeError if obj is null or undefined,
      // or convent obj to undefined if obj is a primitive value... it is ok.
      value = value[prop]
    }

    match[1] = match[0]   // to replace all the match
  }

  return value
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
      const index = start + match.index
      const value = getValue(values[vname], match)

      magicStr.overwrite(index, index + match[1].length, stringifyValue(value))
      changes = true
    }

    match = re.exec(fragment)
  }

  return changes
}
