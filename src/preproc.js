/**
 * rollup-plugin-jspp entry point
 * @module
 */
import MagicString from 'magic-string'
import Parser from './parser'
import parseOptions from './parse-options'
import remapVars from './remap-vars'


export default function preproc (code, filename, options) {

  options = parseOptions(filename, options)

  const magicStr  = new MagicString(code)
  const parser    = new Parser(options)

  const re = parser.getRegex()  // $1:keyword, $2:expression

  let changes   = false
  let output    = true
  let realStart = 0
  let hideStart = 0
  let lastIndex = 0
  let match, index

  re.lastIndex = 0

  while ((match = re.exec(code))) {

    index = match.index

    if (output && lastIndex < index) {
      pushCache(code.slice(lastIndex, index), lastIndex)
    }

    lastIndex = re.lastIndex

    if (output === parser.parse(match)) {
      if (output) {
        lastIndex = removeBlock(index, lastIndex)
      }
    } else {
      output = !output
      if (output) {
        // output begins, remove the hidden block now
        lastIndex = removeBlock(hideStart, lastIndex)
      } else {
        // output ends, for now, all we do is to save
        // the pos where the hidden block begins
        hideStart = index
      }
    }

  }

  if (!parser.close()) {  // let parser to detect unbalanced blocks
    output = false
  }

  if (output && code.length > lastIndex) {
    pushCache(code.slice(lastIndex), lastIndex)
  }

  // done, return an object if there was changes
  if (changes) {
    const result = {
      code: magicStr.toString()
    }
    if (changes && options.sourceMap) {
      const name = options.values._FILE

      result.map = magicStr.generateMap({
        source: name,
        file: name.split(/[\\/]/).pop(),
        hires: true
      })
    }
    return result
  }

  return code

  // helpers ==============================================

  function pushCache (str, start) {
    if (str && ~str.indexOf('$_')) {
      changes = remapVars(magicStr, options.values, str, start) || changes
    }
  }

  function removeBlock (start, end) {
    let block = ''

    if (options.keepLines) {
      block = code.slice(start, end).replace(/[^\r\n]+/g, '')

    // @TODO: Remove first jscc lines
    } else if (start > realStart) {
      --start
      if (code[start] === '\n' && code[start - 1] === '\r') {
        --start
      }
    } else if (end < code.length && /[\n\r]/.test(code[end])) {
      ++end
      if (code[end] === '\n' && code[end - 1] === '\r') {
        ++end
      }
      realStart = end
    }
    magicStr.overwrite(start, end, block)
    changes = true

    return end
  }
}
