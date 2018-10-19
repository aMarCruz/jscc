import MagicString from 'magic-string'
import { parseChunks } from './parse-chunks'
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

  const magicStr = new MagicString(source)

  /**
   * If the parsed `chunk` seems to contain varnames to replace, call the
   * remapVars function which will make the replacement and store the chunk
   * into the MagicString intance. Otherwise, do nothing.
   *
   * @param str Parsed chunk. Can be empty
   * @param start Position of the chunk into the original buffer
   * @returns `true` if the chunk was changed
   */
  const flush = (str: string, start: number) => {
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
  const remove = (start: number, end: number) => {
    let block = ''

    if (props.keepLines) {
      block = source.slice(start, end).replace(/[^\r\n]+/g, '')

    } else if (end < source.length) {
      end += source[end] === '\r' && source[end + 1] === '\n' ? 2 : 1
    }

    magicStr.overwrite(start, end, block)
    return end
  }

  // Parse the buffer chunk by chunk and get the changed status
  const changes = parseChunks(source, props, flush, remove)

  // Always returns an object, the sourceMap will be added only...
  const result: JsccParserResult = {
    code: changes ? magicStr.toString() : source,
  }

  // ...if it is requiered and the source has changed.
  if (changes && props.sourceMap) {
    result.map = magicStr.generateMap({
      source: filename || undefined,
      includeContent: props.mapContent === true,
      hires: props.mapHires !== false,
    })
  }

  return result
}
