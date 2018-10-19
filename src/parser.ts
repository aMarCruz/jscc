/*
  Parser for conditional comments
*/
import { STRINGS, ASSIGNMENT, VARNAME } from './regexes'
import { evalExpr } from './eval-expr'

interface ParserState {
  state: State;
  block: Block;
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

// Want this to check endif scope
const ENDIF_MASK = Block.IF | Block.ELSE

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

  private _cc = [{
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
    const cc    = this._cc

    let ccInfo  = cc[cc.length - 1]
    let state   = ccInfo.state

    switch (key) {
      // #if* pushes WORKING or TESTING, unless the state is ENDING
      case 'if':
      case 'ifset':
      case 'ifnset':
        state = state === State.ENDING ? state
          :  this._getValue(key, expr) ? State.WORKING : State.TESTING
        ccInfo = { state, block: Block.IF }
        cc.push(ccInfo)
        break

      case 'elif':
        // #elif swap the state, unless it is ENDING
        this._checkBlock(ccInfo, key)
        if (state === State.WORKING) {
          ccInfo.state = State.ENDING
        } else if (state === State.TESTING && this._getValue('if', expr)) {
          ccInfo.state = State.WORKING
        }
        break

      case 'else':
        // #else set the state to WORKING or ENDING
        this._checkBlock(ccInfo, key)
        ccInfo.block = Block.ELSE
        ccInfo.state = state === State.TESTING ? State.WORKING : State.ENDING
        break

      case 'endif':
        // #endif pops the state
        this._checkBlock(ccInfo, key)
        cc.pop()
        ccInfo = cc[cc.length - 1]
        break

      default:
        // #set #unset #error is processed for working blocks only
        this._handleInstruction(key, expr, state)
        break
    }

    return ccInfo.state === State.WORKING
  }

  /**
   * Check unclosed blocks before vanish.
   *
   * @returns {boolean} `true` if no error.
   */
  close () {
    const cc  = this._cc
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
   * Internal error handler.
   * This wrap a call to `options.errorHandler` that throws an exception.
   *
   * _NOTE:_ Sending `Error` enhances coverage of errorHandler that must
   *    be prepared to receive Error objects in addition to strings.
   *
   * @param {string} message - Description of the error
   */
  private _emitError (message: string) {
    this.options.errorHandler(new Error(message))
  }

  /**
   * Retrieve the required expression with the jscc comment removed.
   * It is necessary to skip quoted strings and avoid truncation
   * of expressions like "file:///path"
   *
   * @param {string} key The key name
   * @param {string} expr The extracted expression
   * @returns {string} Normalized expression.
   */
  private _normalize (key: string, expr: string) {
    // anything after `#else/#endif` is ignored
    if (key === 'else' || key === 'endif') {
      return ''
    }

    // ...other keywords must have an expression
    if (!expr) {
      this._emitError(`Expression expected for #${key}`)
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
  private _getValue (ckey: 'if' | 'ifset' | 'ifnset', expr: string) {

    if (ckey !== 'if') {
      const yes = expr in this.options.values ? 1 : 0

      return ckey === 'ifnset' ? yes ^ 1 : yes
    }

    // returns the raw value of the expression
    return evalExpr(this.options, expr)
  }

  /**
   * Throws if the current block is not of the expected type.
   */
  private _checkBlock (ccInfo: ParserState, key: string) {
    const block = ccInfo.block
    const mask = key === 'endif' ? ENDIF_MASK : Block.IF

    if (block === Block.NONE || block !== (block & mask)) {
      this._emitError(`Unexpected #${key}`)
    }
  }

  /**
   * Handles an instruction that change a varname or emit an error
   * (currenty #set, #unset, and #error).
   *
   * @param expr Normalized expression
   */
  private _handleInstruction (key: string, expr: string, state: State) {
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
  }

  /**
   * Evaluates an expression and add the result to the `values` property.
   *
   * @param expr Expression normalized in the "varname=value" format
   */
  private _set (expr: string) {
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
  private _unset (varname: string) {
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
  private _error (expr: string) {
    expr = String(evalExpr(this.options, expr))
    this._emitError(expr)
  }
}
