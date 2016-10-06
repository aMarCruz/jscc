
import { STRINGS, EVLVARS } from './revars'

// For replacing of jspreproc variables ($1 = prefix, $2 = varname)
const _REPVARS = RegExp(`${STRINGS.source}|${EVLVARS.source}`, 'g')

/**
 * Method to perform the evaluation of the received string using
 * a function instantiated dynamically.
 *
 * @param   {string} str - String to evaluate, can include other defined vars
 * @param   {object} ctx - Set of variable definitions
 * @returns {any}          The result.
 */
export default function evalExpr (str, ctx) {

  // var replacement
  const _repVars = function (m, p, v) {
    return v
      ? p + (v in ctx ? `this.${v}` : v in global ? `global.${v}` : 'undefined')
      : m
  }

  const expr = str
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(_REPVARS, _repVars)

  let result

  try {
    // eslint-disable-next-line no-new-func
    const fn = new Function('', `return (${expr});`)
    result = fn.call(ctx)
  } catch (e) {
    e.message += ` in expression: ${expr}`
    throw e
  }

  return result
}
