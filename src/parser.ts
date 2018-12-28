/*
  Parser for conditional comments
*/
import evalExpr = require('./eval-expr')
import getExpr = require('./get-expr')
import R = require('./regexes')

interface StateInfo {
  state: State
  block: Block
}

type IfDirective = 'if' | 'ifset' | 'ifnset'

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

/**
 * Matches a line with a directive without its line-ending because it can be
 * at the end of the file with no last EOL.
 *
 * $1: Directive without the '#' ('if', 'elif', 'else', etc)
 * $2: Possible expression (can be empty or have a comment)
 */
const S_RE_BASE = /^[ \t\f\v]*(?:@)#(if|ifn?set|elif|else|endif|set|unset|error)(?:(?=[ \t])(.*)|\/\/.*)?$/.source

/**
 * Conditional comments parser
 *
 * @param {object} props - The global options
 */
class Parser {

  private _cc = [{
    block: Block.NONE,
    state: State.WORKING,
  }]

  constructor (private options: JsccProps) {
  }

  /**
   * Returns a regex that matches lines with directives through all the buffer.
   *
   * @returns {RegExp} regex with the flags `global` and `multiline`
   */
  public getRegex () {
    return RegExp(S_RE_BASE.replace('@', this.options.prefixes), 'gm')
  }

  /**
   * Parses conditional comments to determinate if we need disable the output.
   *
   * @param   {Array} match - Object with the key/value of the directive
   * @returns {boolean}       Output state, `false` to hide the output.
   */
  public parse (match: RegExpExecArray) {

    const key   = match[1]
    const expr  = this._normalize(key, match[2])

    let ccInfo  = this._cc[this._cc.length - 1]

    switch (key) {
      // #if* pushes WORKING or TESTING, unless the state is ENDING
      case 'if':
      case 'ifset':
      case 'ifnset':
        ccInfo = this._pushState(ccInfo, key, expr)
        break

      case 'elif':
      case 'else':
        // #elif swap the state, unless it is ENDING
        // #else set the state to WORKING or ENDING
        this._handleElses(ccInfo, key, expr)
        break

      case 'endif':
        // #endif pops the state
        ccInfo = this._popState(ccInfo, key)
        break

      default:
        // #set #unset #error is processed for working blocks only
        this._handleInstruction(key, expr, ccInfo.state)
    }

    return ccInfo.state === State.WORKING
  }

  /**
   * Check unclosed blocks before vanish.
   *
   * @returns {boolean} `true` if no error.
   */
  public close () {
    const cc  = this._cc
    const err = cc.length !== 1 || cc[0].state !== State.WORKING

    if (err) {
      this._emitError('Unexpected end of file')
    }
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

    // get a normalized expression
    return getExpr(key, expr)
  }

  /**
   * Throws if the current block is not of the expected type.
   */
  private _checkBlock (ccInfo: StateInfo, key: string) {
    const block = ccInfo.block
    const mask = key === 'endif' ? ENDIF_MASK : Block.IF

    if (block === Block.NONE || block !== (block & mask)) {
      this._emitError(`Unexpected #${key}`)
    }
  }

  /**
   * Push a `#if`, `#ifset`, or `#ifnset` directive
   */
  private _pushState (ccInfo: StateInfo, key: IfDirective, expr: string) {
    ccInfo = {
      block: Block.IF,
      state: ccInfo.state === State.ENDING ? State.ENDING
      :        this._getIfValue(key, expr) ? State.WORKING : State.TESTING,
    }
    this._cc.push(ccInfo)
    return ccInfo
  }

  /**
   * Handles `#elif` and `#else` directives.
   */
  private _handleElses (ccInfo: StateInfo, key: string, expr: string) {
    this._checkBlock(ccInfo, key)

    if (key === 'else') {
      ccInfo.block = Block.ELSE
      ccInfo.state = ccInfo.state === State.TESTING ? State.WORKING : State.ENDING

    } else if (ccInfo.state === State.WORKING) {
      ccInfo.state = State.ENDING

    } else if (ccInfo.state === State.TESTING && this._getIfValue('if', expr)) {
      ccInfo.state = State.WORKING
    }
  }

  /**
   * Pop the if, ifset, or ifnset directives after endif.
   */
  private _popState (ccInfo: StateInfo, key: string) {
    this._checkBlock(ccInfo, key)

    const cc = this._cc
    cc.pop()
    return cc[cc.length - 1]
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
          expr = String(evalExpr(this.options, expr))
          this._emitError(expr)
      }
    }
  }

  /**
   * Evaluates an expression and add the result to the `values` property.
   *
   * @param expr Expression normalized in the "varname=value" format
   */
  private _set (expr: string) {
    const match = expr.match(R.ASSIGNMENT)

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
    if (varname.match(R.VARNAME)) {
      delete this.options.values[varname]
    } else {
      this._emitError(`Invalid memvar name "${varname}"`)
    }
  }

  /**
   * Evaluates the expression of a `#if`, `#ifset`, or `#ifnset` directive.
   *
   * For `#ifset` and #ifnset, the value is evaluated here,
   * For `#if`, it calls `evalExpr`.
   *
   * @param key The key name
   * @param expr The extracted expression
   * @returns Evaluated expression.
   */
  private _getIfValue (key: IfDirective, expr: string) {

    // Returns the raw value for #if expressions
    if (key === 'if') {
      return evalExpr(this.options, expr) ? 1 : 0
    }

    // Returns a boolean-like number for ifdef/ifndef
    let yes = expr in this.options.values ? 1 : 0
    if (key === 'ifnset') {
      yes ^= 1  // invert
    }

    return yes
  }
}

export = Parser
