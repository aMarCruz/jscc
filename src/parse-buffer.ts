import MagicString from 'magic-string'
import { Parser } from './parser'
import { remapVars } from './remap-vars'

/**
 * Parse the received buffer and returns an object with the parsed code and its
 * sourceMap, if required by `props` and the buffer has changed.
 *
 * @param source Source code
 * @param filename Full filename
 * @param props Parsed user options
 */
export function parseBuffer (
  source: string,
  filename: string,
  props: JsccProps
) {

  const magicStr  = new MagicString(source)
  const parser    = new Parser(props)

  /**
   * If the parsed `chunk` seems to contain varnames to replace, call the
   * remapVars function which will make the replacement and store the chunk
   * into the MagicString intance. Otherwise, do nothing.
   *
   * @param str Parsed chunk. Can be empty
   * @param start Position of the chunk into the original buffer
   * @returns `true` if the chunk was changed
   */
  const pushCache = (str: string, start: number) => {
    return ~str.indexOf('$_') &&
      remapVars(magicStr, props.values, str, start)
  }

  /**
   * Removes the block from the `start` to the `end` position, inclusive, plus
   * the following line-ending (one char for mac/unix, two for windows type).
   *
   * @param start Starting position of the chunk inside the original buffer
   * @param end Ending position of the chunk (the line-ending)
   * @returns The position of the character following the removed block.
   */
  const removeBlock = (start: number, end: number) => {
    let block = ''

    if (props.keepLines) {
      block = source.slice(start, end).replace(/[^\r\n]+/g, '')

    } else if (end < source.length) {
      end += source[end] === '\r' && source[end + 1] === '\n' ? 2 : 1
    }

    magicStr.overwrite(start, end, block)
    return end
  }

  /*
    The main routine search the starting of jscc directives through the buffer.
    For each match found, call the parser with the result of the regex.
    The parser will return the next position from which to continue the search.
  */

  let changes     = false       // for performance, avoid generating sourceMap
  let hasOutput   = true        // the output state of the parser starts `true`
  let hideStart   = 0           // keep the start position of the block to hide
  let lastIndex   = 0           // keep the position of the next chunk to parse

  const re = parser.getRegex()  // $1:keyword, $2:expression
  let match = re.exec(source)

  while (match) {
    const index = match.index

    if (hasOutput && lastIndex < index) {
      if (pushCache(source.slice(lastIndex, index), lastIndex)) {
        changes = true
      }
    }

    lastIndex = re.lastIndex

    if (hasOutput === parser.parse(match)) {
      // The output state has not changed: if the output is enabled, remove
      // the line of the processed directive.
      // (otherwise it will removed together with the current hidden block).
      if (hasOutput) {
        lastIndex = re.lastIndex = removeBlock(index, lastIndex)
        changes = true
      }

    } else if (hasOutput) {
      // The output ends: for now, we only save the position where this new
      // hidden block begins.
      hasOutput = false
      hideStart = index

    } else {
      // The output begins: remove the hidden block that we are leaving.
      // (hasOutput is initialized with `true`, so a hidden block exists)
      hasOutput = changes = true
      lastIndex = re.lastIndex = removeBlock(hideStart, lastIndex)
    }

    match = re.exec(source)
  }

  // This will throw if the buffer has unbalanced blocks
  parser.close()

  if (hasOutput && source.length > lastIndex &&
      pushCache(source.slice(lastIndex), lastIndex)) {
    changes = true
  }

  // always returns an object
  const result: JsccParserResult = {
    code: changes ? magicStr.toString() : source,
  }

  if (changes && props.sourceMap) {
    result.map = magicStr.generateMap({
      source: filename || undefined,
      includeContent: props.mapContent !== false,
      hires: props.mapHires !== false,
    })
  }

  return result
}
