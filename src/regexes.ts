/*
  regex list
*/

/**
 * Stringified regex to compose another regex that supports single and double
 * quoted strings.
 * This is some complex regex, but is the most efficient implementation in JS.
 */
const STR_BASE = /"[^"\n\r\\]*(?:\\(?:\r\n?|[\S\s])[^"\n\r\\]*)*"/.source

/**
 * Test for valid jscc varnames.
 */
export const VARNAME = /^_[0-9A-Z][_0-9A-Z]*$/

/**
 * Matches jscc var assignments in the format "_VAR=expr" of jscc directives.
 *
 * - $1: varname
 * - $2: value (well... rest of the chars, including any comment)
 */
export const ASSIGNMENT = /^\s*(_[0-9A-Z][_0-9A-Z]*)\s*=?(.*)/

/**
 * Regex to search varnames (format "_VAR") inside jscc expressions.
 *
 * __NOTE:__
 *
 * This function allows the varname to be followed by any char that is not
 * not part of another jscc varname or JS variable name. Because this, it
 * supports properties (ex: `_VAR.prop` or `_VAR['prop']`) to be evaluated
 * by the `evalExpr` function.
 *
 * - $1: char before varname, not in the set [$\w.]
 * - $2: varname
 */
export const JSCC_VARS = /(^|[^$\w.])(_[0-9A-Z][_0-9A-Z]*)(?=[^$0-9a-z]|$)/g

/**
 * Regex to search varnames in the format "$_VAR" followed by zero or more
 * properties with dot notation _inside_ the code already processed.
 *
 * __NOTE:__
 *
 * This regex allows var concatenation like in `$_VAR1$_VAR2`
 *
 * Code supporting macro replacement was removed in v1.0. It still needed more
 * work to skip nested braces, strings, regexes, ES6 TLS... and I'm not sure if
 * this feature is necessary, cannot find a valid use case to keep it.
 *
 * - $1: var name
 * - $2: optional expression
 */
export const VARS_TO_REPL = /(?:(\$_[0-9A-Z][_0-9A-Z]*)((?:\.\w+)+)*)(?=\W|$)/g

/**
 * Matches single and double quoted strings taking care of embedded (escaped)
 * quotes and EOLs of multiline strings.
 *
 * It has no captures.
 */
export const STRINGS = RegExp(STR_BASE + '|' + STR_BASE.replace(/"/g, "'"), 'g')

/**
 * Matches line-ending of win, mac, and unix type
 */
export const EOLS = /[^\r\n]+/g
