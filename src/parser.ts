/*
  Parser for conditional comments
*/
import { STRINGS, ASSIGNMENT, VARNAME } from './regexes'
import { evalExpr } from './eval-expr'

interface ParserState {
  state: State,
  block: Block,
}

// branch type
const enum Block {
  NONE,
  IF,
  ELSE,
}

// status
const enum State {
  WORKING,
  TESTING,
  ENDING,
}

// Matches a line with a directive, not including line-ending
const S_RE_BASE = /^[ \t\f\v]*(?:@)#(if|ifn?set|elif|else|endif|set|unset|error)(?:(?=[ \t])(.*)|\/\/.*)?$/.source

// Matches a substring that includes the first unquoted `//`
const R_LASTCMT = new RegExp(`${STRINGS.source}|(//)`, 'g')

/**
 * Conditional comments parser
 *
 * @param {object} props - The global options
 * @class
 */
export class Parser {

  private cc = [{
    state: State.WORKING,
    block: Block.NONE,
  }]

  constructor (private options: JsccProps) {
  }

  /**
   * Parses conditional comments to determinate if we need disable the output.
   *
   * @param   {Array} match - Object with the key/value of the directive
   * @returns {boolean}       Output state, `false` to hide the output.
   */
  parse (match: RegExpExecArray) {

    const key   = match[1]
    const expr  = this._normalize(key, match[2])
    const cc    = this.cc

    let ccInfo  = cc[cc.length - 1]
    let state   = ccInfo.state

    switch (key) {
      // #if* pushes WORKING or TESTING, unless the state is ENDING
      case 'if':
      case 'ifset':
      case 'ifnset':
        if (state !== State.ENDING) {
          state = this._getValue(key, expr) ? State.WORKING : State.TESTING
        }
        ccInfo = { state, block: Block.IF }
        cc.push(ccInfo)
        break

      case 'elif':
        // #elif swap the state, unless it is ENDING
        this._checkBlock(ccInfo, Block.IF, key)
        if (state === State.TESTING && this._getValue('if', expr)) {
          ccInfo.state = State.WORKING
        } else if (state === State.WORKING) {
          ccInfo.state = State.ENDING
        }
        break

      case 'else':
        // #else set the state to WORKING or ENDING
        this._checkBlock(ccInfo, Block.IF, key)
        ccInfo.block = Block.ELSE
        ccInfo.state = state === State.TESTING ? State.WORKING : State.ENDING
        break

      case 'endif':
        // #endif pops the state
        this._checkBlock(ccInfo, Block.IF | Block.ELSE, key)
        cc.pop()
        ccInfo = cc[cc.length - 1]
        break

      default:
        // #set #unset #error is processed for working blocks only
        if (state === State.WORKING) {
          switch (key) {
            case 'set':
              this._set(expr)
              break
            case 'unset':
              this._unset(expr)
              break
            case 'error':
              this._error(expr)
          }
        }
        break
    }

    return ccInfo.state === State.WORKING
  }

  // Inner helper - throws if the current block is not of the expected type
  _checkBlock (ccInfo: ParserState, mask: number, ckey: string) {
    const block = ccInfo.block

    if (block === Block.NONE || block !== (block & mask)) {
      this._emitError(`Unexpected #${ckey}`)
    }
  }


  /**
   * Check unclosed blocks before vanish.
   *
   * @returns {boolean} `true` if no error.
   */
  close () {
    const cc  = this.cc
    const err = cc.length !== 1 || cc[0].state !== State.WORKING

    if (err) {
      this._emitError('Unexpected end of file')
    }
  }

  /**
   * Returns a regex that matches directives through all the code.
   *
   * @returns {RegExp} Global-multiline regex
   */
  getRegex () {
    return RegExp(S_RE_BASE.replace('@', this.options.prefixes), 'gm')
  }

  /**
   * Internal error handler. Set the state to ERROR and calls the
   * method `options.errorHandler`, if any, or throws an error.
   *
   * @param {string} message - Error description
   */
  _emitError (message: string) {
    this.options.errorHandler(new Error(message))
  }

  /**
   * Retrieve the required expression with the jscc comment removed.
   * It is necessary to skip quoted strings and avoid truncation
   * of expressions like "file:///path"
   *
   * @param   {string} ckey - The key name
   * @param   {string} expr - The extracted expression
   * @returns {string}      Normalized expression.
   */
  _normalize (ckey: string, expr: string) {
    // anything after `#else/#endif` is ignored
    if (ckey === 'else' || ckey === 'endif') {
      return ''
    }

    // ...other keywords must have an expression
    if (!expr) {
      this._emitError(`Expression expected for #${ckey}`)
    }

    let match
    R_LASTCMT.lastIndex = 0
    while ((match = R_LASTCMT.exec(expr))) {
      if (match[1]) {
        expr = expr.slice(0, match.index)
        break
      }
    }

    return expr.trim()
  }

  /**
   * Expression evaluation for `#if-#ifset-#ifnset`.
   * Intercepts the `#ifset-#ifnset` shorthands, call `evalExpr` for `#if`
   * statements.
   *
   * @param ckey The key name
   * @param expr The extracted expression
   * @returns Evaluated expression.
   */
  _getValue (ckey: 'if' | 'ifset' | 'ifnset', expr: string) {

    if (ckey !== 'if') {
      const yes = expr in this.options.values ? 1 : 0

      return ckey === 'ifnset' ? yes ^ 1 : yes
    }

    // returns the raw value of the expression
    return evalExpr(this.options, expr)
  }

  /**
   * Evaluates an expression and add the result to the `values` property.
   *
   * @param expr Expression normalized in the "varname=value" format
   */
  _set (expr: string) {
    const match = expr.match(ASSIGNMENT)

    if (match) {
      const varname = match[1]
      const exprStr = match[2] || ''

      this.options.values[varname] = exprStr
        ? evalExpr(this.options, exprStr.trim()) : undefined
    } else {
      this._emitError(`Invalid memvar name or assignment: ${expr}`)
    }
  }

  /**
   * Remove the definition of a variable.
   *
   * @param varname Variable name
   */
  _unset (varname: string) {
    if (varname.match(VARNAME)) {
      delete this.options.values[varname]
    } else {
      this._emitError(`Invalid memvar name "${varname}"`)
    }
  }

  /**
   * Throws an user generated error.
   *
   * @param expr Expression
   */
  _error (expr: string) {
    expr = String(evalExpr(this.options, expr))
    this._emitError(expr)
  }
}
