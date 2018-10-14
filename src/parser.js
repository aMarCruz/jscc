/*
    Parser for conditional comments
 */
import { STRINGS, VARPAIR, VARNAME } from './revars'
import evalExpr from './evalexpr'

// branch type
const NONE = 0
const IF   = 1
const ELSE = 2

// status
const WORKING = 0
const TESTING = 1
const ENDING  = 2
const ERROR   = 3

// Matches a line with a directive, not including line-ending
const S_RE_BASE = /^[ \t\f\v]*(?:@)#(if|ifn?set|el(?:if|se)|endif|set|unset|error)(?:(?=[ \t])(.*)|\/\/.*)?$/.source

// Match a substring that includes the first unquoted `//`
const R_LASTCMT = new RegExp(`${STRINGS.source}|(//)`, 'g')


/**
 * Conditional comments parser
 *
 * @param {object} options - The global options
 * @class
 */
export default function Parser (options) {
  this.options = options
  this.cc = [{
    state: WORKING,
    block: NONE,
  }]
}


Parser.prototype = {
  /**
   * Parses conditional comments to determinate if we need disable the output.
   *
   * @param   {Array} match - Object with the key/value of the directive
   * @returns {boolean}       Output state, `false` to hide the output.
   */
  parse (match) {         //eslint-disable-line complexity
    const _self = this
    const cc    = _self.cc
    let ccInfo  = cc[cc.length - 1]
    let state   = ccInfo.state

    if (state === ERROR) {
      return false
    }

    const key  = match[1]
    const expr = _self._normalize(key, match[2])

    switch (key) {
      // Conditional blocks -- `#if-ifset-ifnset` pushes the state and `#endif` pop it
      case 'if':
      case 'ifset':
      case 'ifnset':
        if (state !== ENDING) {
          state = _self._getValue(key, expr) ? WORKING : TESTING
        }
        ccInfo = { state, block: IF }
        cc.push(ccInfo)
        break

      case 'elif':
        if (_checkBlock(IF)) {
          if (state === TESTING && _self._getValue('if', expr)) {
            ccInfo.state = WORKING
          } else if (state === WORKING) {
            ccInfo.state = ENDING
          }
        }
        break

      case 'else':
        if (_checkBlock(IF)) {
          ccInfo.block = ELSE
          ccInfo.state = state === TESTING ? WORKING : ENDING
        }
        break

      case 'endif':
        if (_checkBlock(IF | ELSE)) {
          cc.pop()
          ccInfo = cc[cc.length - 1]
        }
        break

      default:
        // set-unset-error is processed only for working blocks
        if (state === WORKING) {
          switch (key) {
            case 'set':
              _self._set(expr)
              break
            case 'unset':
              _self._unset(expr)
              break
            case 'error':
              _self._error(expr)
              //_error throws
          }
        }
        break
    }

    return ccInfo.state === WORKING

    // Inner helper - throws if the current block is not of the expected type
    function _checkBlock (mask) {
      const block = ccInfo.block

      if (block !== NONE && block === (block & mask)) {
        return true
      }
      _self._emitError(`Unexpected #${key}`)
      return false
    }
  },

  /**
   * Check unclosed blocks before vanish.
   *
   * @returns {boolean} `true` if no error.
   */
  close () {
    const cc  = this.cc
    const len = cc.length
    const err = len !== 1 || cc[0].state !== WORKING

    if (err && cc[0].state !== ERROR) {
      this._emitError('Unexpected end of file')
    }
    this.options = false
    return !err
  },

  /**
   * Returns the regex to match directives through all the code.
   *
   * @returns {RegExp} Global-multiline regex
   */
  getRegex () {
    return RegExp(S_RE_BASE.replace('@', this.options.prefixes), 'gm')
  },

  /**
   * Internal error handler. Set the state to ERROR and calls the
   * method `options.errorHandler`, if any, or throws an error.
   *
   * @param {string} message - Error description
   */
  _emitError (message) {
    const errFn = this.options.errorHandler

    //message = `jspp [${this.cc.fname || 'input'}] : ${message}`
    this.cc[this.cc.length - 1].state = this.cc[0].state = ERROR

    if (typeof errFn == 'function') {
      errFn(message)
    } else {
      throw new Error(message)
    }
  },

  /**
   * Retrieve the required expression with the jscc comment removed.
   * It is necessary to skip quoted strings and avoid truncation
   * of expressions like "file:///path"
   *
   * @param   {string} ckey - The key name
   * @param   {string} expr - The extracted expression
   * @returns {string}      Normalized expression.
   */
  _normalize (ckey, expr) {
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
  },

  /**
   * Expression evaluation for `#if-#ifset-#ifnset`.
   * Intercepts the `#ifset-#ifnset` shorthands, call `evalExpr` for `#if` statements.
   * @param   {string} ckey - The key name
   * @param   {string} expr - The extracted expression
   * @returns {string}      Evaluated expression as string.
   */
  _getValue (ckey, expr) {
    if (ckey !== 'if') {
      const yes = expr in this.options.values ? 1 : 0

      return ckey === 'ifnset' ? yes ^ 1 : yes
    }
    // returns the raw value of the expression
    return evalExpr(this, expr)
  },

  _set (s) {
    const m = s.match(VARPAIR)
    if (m) {
      const k = m[1]
      const f = m[2] || ''
      const v = m[3] || ''

      this.options.values[k] = v ? evalExpr(this, v.trim(), f.trim()) : undefined
    } else {
      this._emitError(`Invalid memvar assignment "${s}"`)
    }
  },

  _unset (s) {
    const def = s.match(VARNAME)
    if (def) {
      delete this.options.values[s]
    } else {
      this._emitError(`Invalid memvar name "${s}"`)
    }
  },

  _error (s) {
    s = evalExpr(this, s)
    throw new Error(s)
  },
}
