/*
  regex list
*/
import _R = require('perf-regexes')

/**
 * Stringified regex to match a valid jscc varname.
 */
const VAR_BASE = /_[0-9A-Z][_0-9A-Z]*/.source

/**
 * Creates a new regex with a sub-regex for varnames inserted in the holes
 * marked with '@'. Avoid editing all the regexes if the varname spec is
 * cahnged.
 *
 * @param re Regex to transform
 * @param f Regex flags
 */
const mkRe = (re: RegExp, f?: string) => RegExp(re.source.replace(/@/g, VAR_BASE), f || '')

/**
 * Resulting regexes and templates.
 */
const R = {

  /**
   * Matches a valid jscc varname.
   */
  VARNAME: mkRe(/^@$/),

  /**
   * Matches jscc var assignments in the format "_VAR=expr" of jscc directives.
   *
   * - $1: varname
   * - $2: rest of the line, including value and comment, excluding '='
   */
  ASSIGNMENT: mkRe(/^\s*(@)\s*=?(.*)/),

  /**
   * Regex source to search varnames in jscc expressions (without the '$').
   *
   * __NOTE:__
   *
   * This template allows the varname to be followed by any char that is not
   * not part of another jscc varname or JS variable name. Because this, it
   * supports properties (ex: `_VAR.prop` or `_VAR['prop']`) to be evaluated
   * by the `evalExpr` function.
   *
   * - $1: char preceding the varname, not in the set [$\w.]
   * - $2: varname
   */
  S_VARNAMES: mkRe(/(^|[^$\w.])(@)(?=[^$0-9a-z]|$)/).source,

  /**
   * Matches varnames in the format "$_VAR", followed by zero or more
   * properties with dot notation _inside_ the code already processed.
   *
   * - $1: var name
   * - $2: optional expression
   *
   * __NOTE:__
   *
   * This regex allows concatenation of varnames, like in `$_VAR1$_VAR2`
   *
   * Code supporting macro replacement was removed in v1.0. It still needed more
   * work to skip nested braces, strings, regexes, ES6 TLS... and I'm not sure
   * if this feature is necessary, cannot find a valid use case to keep it.
   */
  VARS_TO_REPL: mkRe(/(?:(\$@)((?:\.\w+)+)*)(?=\W|$)/, 'g'),

  /**
   * Template to create regexes that match single and double quoted strings.
   *
   * Takes care of embedded (escaped) quotes and EOLs of multiline strings.
   *
   * It has no captures.
   */
  S_STRINGS: _R.JS_STRING.source,

}

export = R
