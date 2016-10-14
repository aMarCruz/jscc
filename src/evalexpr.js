
import { STRINGS, EVLVARS } from './revars'

// For replacing of jspreproc variables ($1 = prefix, $2 = varname)
const _REPVARS = RegExp(`${STRINGS.source}|${EVLVARS.source}`, 'g')

/**
 * Method to perform the evaluation of the received string using
 * a function instantiated dynamically.
 *
 * @param   {object} ctx - Object with the current set of variables
 * @param   {string} str - String to evaluate, can include other defined vars
 * @returns {any}          The result.
 */
export default function evalExpr (ctx, str) {
  const values = ctx.options.values

  // var replacement
  const _repVars = function (m, p, v) {
    return v
      ? p + (v in values ? `this.${v}` : v in global ? `global.${v}` : 'undefined')
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
    result = fn.call(values)
  } catch (e) {
    result = false
    ctx._emitError(`${e.message} in expression "${expr}"`)
  }

  return result
}
