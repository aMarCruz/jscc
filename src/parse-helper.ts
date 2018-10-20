import { remapVars } from './remap-vars'

/**
 * Create helper methids with the magicStr and source in the closure,
 * for easy sharing with other called functions.
 *
 * @param magicStr MagicString instance
 * @param source Original source
 * @param props jscc properties
 */

export const createHelper = function (source: string, props: JsccProps) {

  /**
   * If the parsed `chunk` seems to contain varnames to replace, call the
   * remapVars function which will make the replacement and store the chunk
   * into the MagicString intance. Otherwise, do nothing.
   *
   * @param start Position of the chunk into the original buffer
   * @param end Ending position of the chunk.
   * @returns `true` if the chunk was changed
   */
  const commit = (start: number, end: number) => {

    if (start >= end) {
      return false
    }

    // Get the fragment of source where to search varnames to replace
    const chunk = source.slice(start, end)

    // Call remapVars only if a memvar prefix exists in the chunk
    return chunk.indexOf('$_') > -1 && remapVars(props, chunk, start)
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

    props.magicStr.overwrite(start, end, block)
    return end
  }

  return { commit, remove }
}
