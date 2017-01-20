/**
 * rollup-plugin-jspp entry point
 * @module
 */
import MagicString from 'magic-string'
import Parser from './parser'
import parseOptions from './parse-options'
import remapVars from './remap-vars'
import { DIRECTIVES } from './revars'


export default function preproc (code, filename, options) {

  options = parseOptions(filename, options)

  const magicStr  = new MagicString(code)
  const parser    = new Parser(options)

  let changes   = false
  let output    = true
  let hideStart = 0
  let lastIndex = 0
  let match, index

  DIRECTIVES.lastIndex = 0

  while ((match = DIRECTIVES.exec(code))) {
    if (!parser.matchPrefixes(match)) {
      continue
    }

    index = match.index

    if (output && lastIndex < index &&
      pushCache(code.slice(lastIndex, index), lastIndex)) {
      changes = true
    }

    lastIndex = DIRECTIVES.lastIndex

    if (output === parser.parse(match)) {
      if (output) {
        lastIndex = removeBlock(index, lastIndex)
        changes = true
      }
    } else if (output) {
      // output ends, for now, all we do is to save
      // the pos where the hidden block begins
      hideStart = index
      output = false
    } else {
      // output begins, remove the hidden block now
      lastIndex = removeBlock(hideStart, lastIndex)
      output = changes = true
    }

  }

  if (!parser.close()) {  // let parser to detect unbalanced blocks
    output = false
  }

  if (output && code.length > lastIndex &&
      pushCache(code.slice(lastIndex), lastIndex)) {
    changes = true
  }

  // always returns an object
  const result = {
    code: changes ? magicStr.toString() : code
  }

  if (changes && options.sourceMap) {
    result.map = magicStr.generateMap({
      source: filename || null,
      includeContent: options.mapContent !== false,
      hires: options.mapHires !== false
    })
  }

  return result

  // helpers ==============================================

  function pushCache (str, start) {
    let change = str && ~str.indexOf('$_')

    if (change) {
      change = remapVars(magicStr, options.values, str, start)
    }

    return change
  }

  function removeBlock (start, end) {
    let block = ''

    if (options.keepLines) {
      block = code.slice(start, end).replace(/[^\r\n]+/g, '')

    } else if (end < code.length) {
      ++end
      if (code[end] === '\n' && code[end - 1] === '\r') {
        ++end
      }
    }

    magicStr.overwrite(start, end, block)
    return end
  }
}
