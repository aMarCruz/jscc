import { remapVars } from './remap-vars'

/**
 * Helper class for the `parseChunks` function.
 */
export class ParseHelper {

  /**
   * @param source Original source
   * @param props jscc properties
   */
  constructor (private source: string, private props: JsccProps) {
  }

  /**
   * If the parsed `chunk` seems to contain varnames to replace, call the
   * remapVars function which will make the replacement and store the chunk
   * into the MagicString intance. Otherwise, do nothing.
   *
   * @param start Starting position of the chunk into the original buffer
   * @param end Ending position (the character followng the chunk)
   * @param output Must replace the block now?
   * @returns `true` if the chunk was changed
   */
  commit (start: number, end: number, output: boolean) {

    if (!output || start >= end) {
      return false
    }

    // Get the fragment of source where to search varnames to replace
    const chunk = this.source.slice(start, end)

    // Call remapVars only if a memvar prefix exists in the chunk
    return chunk.indexOf('$_') > -1 && remapVars(this.props, chunk, start)
  }

  /**
   * Removes the block from the `start` to the `end` position, inclusive, plus
   * the following line-ending (one char for mac/unix, two for windows type).
   *
   * @param start Starting position of the chunk into the original buffer
   * @param end Ending position (the character followng the chunk)
   * @param output Must remove the block now?
   * @returns Position of the character following the removed block.
   */
  remove (start: number, end: number, output: boolean) {
    let block = ''

    if (this.props.keepLines) {
      if (output) {
        block = this.source.slice(start, end).replace(/[^\r\n]+/g, '')
      }

    } else if (end < this.source.length) {
      end += this.source[end] === '\r' && this.source[end + 1] === '\n' ? 2 : 1
    }

    if (output) {
      this.props.magicStr.overwrite(start, end, block)
    }
    return end
  }
}
