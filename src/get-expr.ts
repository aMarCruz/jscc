import skipRegex = require('skip-regex')
import R = require('./regexes')

/** Flag for ES6 TL in the stack */
const ES6_BQ = '`'

/**
 * Searches the next backtick that signals the end of the ES6 Template Literal
 * or the sequence "${" that starts a sub-expression, skipping any escaped
 * character.
 *
 * @param buffer Whole code
 * @param start Starting position of the template
 * @param stack To save nested ES6 TL positions
 * @returns The end of the string (-1 if not found).
 */
const skipES6TL = (buffer: string, start: number, stack: string[]) => {

  // Only three characters are of interest to this function
  const re = /[`$\\]/g

  // `start` points to the a backtick inside `code`
  re.lastIndex = start + 1

  while (re.exec(buffer)) {
    const pos = re.lastIndex
    const c = buffer[pos - 1]

    if (c === ES6_BQ) {
      return pos                          // found the end of this TL
    }

    /*
      If a sub-expression is found, push a backtick in the stack.
      When the calling loop finds a closing brace and see the backtick,
      it will restore the ES6 TL parsing mode.
    */
    if (c === '$' && buffer[pos] === '{') {
      stack.push(ES6_BQ)
      return pos + 1
    }

    // This is an escaped char, skip it
    re.lastIndex = pos + 1
  }

  return buffer.length  // let JS VM handles this error
}

/**
 * Handles closing brackets. It can be a regular bracket or one closing an
 * ES6 TL expression.
 *
 * @param expr Raw expression
 * @param start Position of this bracket
 * @param stack Brackets stack
 */
const skipBracket = (expr: string, start: number, stack: string[]) => {
  const ch = stack.pop()

  if (ch === '`') {
    return skipES6TL(expr, start, stack)
  }

  // If ch==null then there's an error, returns expr.length to
  // let JS VM handles this.
  return ch ? start + 1 : expr.length
}

/**
 * Handles the extraction of an expression with a comment block slash or regular
 * comment slash.
 *
 * @param expr Raw expression
 * @param index Position of this slash
 */
const handleSlashExtraction = function (expr: string, index: number) {
  if (expr[index + 1] === '/') {
    return expr.slice(0, index)
  }

  if (expr[index - 1] === '*') {
    return expr.slice(0, index - 1)
  }
  return null
}

/**
 * To find the comment (//), it is necessary to skip strings, es6 tl,
 * brackets, and regexes
 */
const RE_EXPR = RegExp(R.S_STRINGS + '|[`/{}]', 'g')

/**
 * Skip ES6 TL in expressions.
 *
 * @param expr Execution context
 * @param start Start of the ES6 TL
 */
const extractExpr = function (expr: string, start: number) {
  const stack: string[] = []
  const re = new RegExp(RE_EXPR)

  re.lastIndex = start
  let mm

  // tslint:disable-next-line:no-conditional-assignment
  while (mm = re.exec(expr)) {
    switch (mm[0]) {
      case '{':
        stack.push('}')
        break
      case '}':
        re.lastIndex = skipBracket(expr, mm.index, stack)
        break
      case '`':
        re.lastIndex = skipES6TL(expr, mm.index, stack)
        break
      case '/':
        const result = handleSlashExtraction(expr, mm.index)
        if (result) {
          return result
        }
        re.lastIndex = skipRegex(expr, mm.index)
    }
  }

  return expr
}

/**
 * Get an expression, removing surrounding whitespace and the trailing comment,
 * if necessary.
 *
 * @param key Keyword for this expression
 * @param expr Raw expression
 */
const getExpr = function (key: string, expr: string) {

  if (expr.indexOf('/') < 0) {
    return expr.trim()
  }

  /*
    When an assignment has a regex (ex: `#set _R /\s/`), skipRegex will not
    recognize it due to invalid syntax. Inserting the missing '=' solves this.
  */
  if (key === 'set') {
    const mm = R.ASSIGNMENT.exec(expr)!
    const ss = mm && mm[2]

    // beware of something like `//#set _V //cmnt`
    // istanbul ignore else
    if (ss) {
      expr = ss.startsWith('//') ? mm[1] : `${mm[1]}=${ss}`
    }
  }

  return extractExpr(expr, 0).trim()
}

export = getExpr
