import MagicString from 'magic-string'
import { Parser } from './parser'
import { parseChunks } from './parse-chunks'
import { remapVars } from './remap-vars'

/**
 * Create helper methids with the magicStr and source in the closure,
 * for easy sharing with other called functions.
 *
 * @param magicStr MagicString instance
 * @param source Original source
 * @param props jscc properties
 */

const createHelper = function (magicStr: MagicString, source: string, props: JsccProps) {
  return {
    /**
     * If the parsed `chunk` seems to contain varnames to replace, call the
     * remapVars function which will make the replacement and store the chunk
     * into the MagicString intance. Otherwise, do nothing.
     *
     * @param str Parsed chunk. Can be empty
     * @param start Position of the chunk into the original buffer
     * @returns `true` if the chunk was changed
     */
    flush (str: string, start: number) {
      return str.indexOf('$_') > -1 && remapVars(magicStr, props.values, str, start)
    },

    /**
     * Removes the block from the `start` to the `end` position, inclusive, plus
     * the following line-ending (one char for mac/unix, two for windows type).
     *
     * @param start Starting position of the chunk inside the original buffer
     * @param end Ending position of the chunk (the line-ending)
     * @returns The position of the character following the removed block.
     */
    remove (start: number, end: number) {
      let block = ''

      if (props.keepLines) {
        block = source.slice(start, end).replace(/[^\r\n]+/g, '')

      } else if (end < source.length) {
        end += source[end] === '\r' && source[end + 1] === '\n' ? 2 : 1
      }

      magicStr.overwrite(start, end, block)
      return end
    },
  }
}


/**
 * Parse the received buffer and returns an object with the parsed code and its
 * sourceMap, if required by `props` and the buffer has changed.
 *
 * @param source Source code
 * @param props Parsed user options
 */
export function parseBuffer (
  source: string,
  props: JsccProps
) {
  const magicStr  = new MagicString(source)
  const helper    = createHelper(magicStr, source, props)

  // Parse the buffer chunk by chunk and get the changed status
  const changes   = parseChunks(new Parser(props), source, helper)

  // Always returns an object, the sourceMap will be added only...
  const result: JsccParserResult = {
    code: changes ? magicStr.toString() : source,
  }

  // ...if it is requiered and the source has changed.
  if (changes && props.sourceMap) {
    result.map = magicStr.generateMap({
      source: props.values._FILE || undefined,
      includeContent: props.mapContent,
      hires: props.mapHires,
    })
  }

  return result
}
