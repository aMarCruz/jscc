/*
  Variable replacement inside the code.
*/
import { VARS_TO_REPL } from './regexes'
import MagicString from 'magic-string'

/**
 * Helper for call `JSON.stringify` in `stringifyObject`.
 *
 * It outputs a valid number for non-finite numbers and the source string of
 * regexes because stringify converts `Infinity` and `-Infinity` to `null`
 * and regexes to `{}` (an empty object).
 */
const stringifyFn = (_: string, value: any) => {
  /*
    Testing `value == Infinity` with primitive number or Number intance
    only returns `true` if value is Infinity or "Infinity" and the like
    for -Infinity.
  */
  if (typeof value != 'string') {
    // eslint-disable-next-line eqeqeq
    if (value == Infinity) {
      return Number.MAX_VALUE
    }
    // eslint-disable-next-line eqeqeq
    if (value == -Infinity) {
      return Number.MIN_VALUE
    }
  }

  return value instanceof RegExp ? value.source : value
}

/**
 * Stringify a non-null object `obj` using the following rules:
 *
 * - NaN    -> 'null' (a Number or Date with a NaN value)
 * - RegExp -> Regex source
 * - Date   -> Date string in JSON format
 * - other  -> JSON.stringify(obj)
 *
 * @param obj Trueish object
 * @returns String representation of the object
 */
const stringifyObject = (obj: object) => {
  let str

  // toISOString throw with NaN dates, toJSON returns `null`
  if (obj instanceof Date) {
    str = obj.toJSON() || 'null'

  } else if (obj instanceof RegExp) {
    str = obj.source

  } else {
    str = JSON.stringify(obj, stringifyFn)
  }

  return str
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
const stringValue = (value: any) => {

  // `NaN` returns `null`, for consistency with `JSON.stringify`
  // eslint-disable-next-line no-self-compare
  if (value !== value) {
    return 'null'
  }

  // stringifyObject accepts `NaN` object but no `null`s.
  return value && typeof value == 'object' ? stringifyObject(value) : String(value)
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
  let match

  // $1: varname including the prefix '$'
  // $2: optional property name(s)

  while ((match = re.exec(fragment))) {
    const vname = match[1].slice(1)    // strip the prefix '$'

    if (vname in values) {
      const index = start + match.index
      const value = getValue(values[vname], match)

      magicStr.overwrite(index, index + match[1].length, stringValue(value))
      changes = true
    }
  }

  return changes
}
