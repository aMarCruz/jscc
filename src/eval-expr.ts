import { STRINGS, JSCC_VARS } from './revars'

// For replacing of jscc variables ($1 = prefix, $2 = varname)
const VARS_TO_EVL = RegExp(`${STRINGS.source}|${JSCC_VARS.source}`, 'g')

/**
 * Method to perform the evaluation of the given string using a function
 * instantiated dynamically.
 *
 * @param ctx Context with the current variables and the error handler
 * @param exprStr String to evaluate, can include other defined vars
 */
export function evalExpr (ctx: JsccProps, exprStr: string) {
  const values = ctx.values

  // var replacement
  const _repVars = (m: string, p: string, v: string) => {
    return v
      ? p + (v in values ? `this.${v}` : v in global ? `global.${v}` : 'undefined')
      : m
  }

  const expr = exprStr
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(VARS_TO_EVL, _repVars)

  let result
  try {
    // eslint-disable-next-line no-new-func
    const fn = new Function('', `return (${expr});`)
    result = fn.call(values)
  } catch (e) {
    result = exprStr
    ctx.errorHandler(`${e.message} in expression "${expr}"`)
  }

  return result
}
