/*
  Variable replacement inside the code.
*/
import R = require('./regexes')

/** Quote types to escape in strings */
const enum QUOTES {
  Single = 1,
  Double = 2,
}

/**
 * Helper for call `JSON.stringify` in `stringifyObject`.
 *
 * It outputs a valid number for non-finite numbers and the source string of
 * regexes because stringify converts `Infinity` and `-Infinity` to `null`
 * and regexes to `{}` (an empty object).
 */
const stringifyFn = (_: string, value: any) => {

  if (value && value.constructor.name === 'Number') {
    /*
      It is necessary to coerce the value to a primitive number because
      `Infinity !== new Number(Infinity)`, and the like for `-Infinity`.
    */
    if (+value === Infinity) {
      return Number.MAX_VALUE
    }
    if (+value === -Infinity) {
      return Number.MIN_VALUE
    }
  }

  return value instanceof RegExp ? value.source : value
}

/**
 * Stringify a non-null object `obj` using the following rules:
 *
 * - NaN    -> 'NaN' (a Number or Date with a NaN value)
 * - RegExp -> Regex source
 * - Date   -> Date string in JSON format
 * - other  -> JSON.stringify(obj)
 *
 * @param obj Trueish object
 * @returns String representation of the object
 */
const stringObject = (obj: object) => {
  let str: string

  // toISOString throw with NaN dates, toJSON returns `null`
  if (obj instanceof Date) {
    str = isNaN(+obj) ? 'NaN' : obj.toJSON()

  } else if (obj instanceof RegExp) {
    str = obj.source

  } else if (obj instanceof String) {
    str = obj.valueOf()

  } else if (obj instanceof Number) {
    str = String(obj)

  } else {
    str = JSON.stringify(obj, stringifyFn)
  }

  return str
}

/**
 * Stringify the given value using this rules:
 *
 * - undefined   -> 'undefined'
 * - null        -> 'null'
 * - NaN         -> 'NaN'
 * - Infinity    -> 'Infinity'
 * - RegExp      -> JSON.stringify(value.source)
 * - objects     -> JSON.stringify(value) (Date as ISO string or `null`)
 * - primitives  -> String(value)
 *
 * @param value any value, including undefined
 */
const stringValue = (value: any, escapeQuotes: number) => {

  // Trap falsy values, including `NaN` and empty strings.
  if (!value) {
    return String(value)
  }

  // stringObject accepts `NaN` objects.
  if (typeof value === 'object') {
    return stringObject(value)
  }

  // Other non-falsy primitive values.
  let str = String(value)

  if (escapeQuotes & QUOTES.Single) {
    str = str.replace(/(?=')/g, '\\')
  }
  if (escapeQuotes & QUOTES.Double) {
    str = str.replace(/(?=")/g, '\\')
  }

  return str
}

/**
 * Returns the value pointed by match[2] and adjust match[1] to cover
 * the length of the replacement.
 *
 * @param value Source value or object
 * @param match Contain the property path in $2
 * @throws TypeError if you try to read the prop on a null object.
 */
const getValueInfo = (value: any, match: RegExpExecArray) => {

  // Get the property path without the first dot
  const propPath = match[2] && match[2].slice(1)
  let length = match[1].length

  // Try to get the property value only if this is an object
  if (propPath) {
    const props = propPath.split('.')
    let prop = props.shift()

    while (prop && typeof value === 'object') {

      // the next assignment will raise a TypeError if the current value
      // is null, undefined, or a primitive value... it is ok.
      value = value[prop]

      // include this prop in the replaced length and pick the next
      length += prop.length + 1
      prop = props.shift()
    }
  }

  return { value, length }
}

/**
 * Replaces memvars in a source fragment with its current values.
 *
 * @param props Jscc properties with the MagicString instance and the values
 * @param fragment Fragment of code to replace and add to `magicStr`
 * @param start Offset where the replacement starts in magicStr.
 */
const remapVars = function _remapVars (props: JsccProps, fragment: string, start: number) {

  // node.js is async, make local copy of the regex
  const re = new RegExp(R.VARS_TO_REPL)
  let changes = false
  let match

  // $1: varname including the prefix '$'
  // $2: optional property name(s)

  // tslint:disable-next-line:no-conditional-assignment
  while (match = re.exec(fragment)) {
    const vname = match[1].slice(1)    // strip the prefix '$'

    if (vname in props.values) {
      const index = start + match.index
      const vinfo = getValueInfo(props.values[vname], match)

      props.magicStr.overwrite(
        index,
        index + vinfo.length,
        stringValue(vinfo.value, props.escapeQuotes)
      )

      changes = true
    }
  }

  return changes
}

export = remapVars
