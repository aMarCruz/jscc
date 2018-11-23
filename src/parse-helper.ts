import remapVars = require('./remap-vars')

/**
 * Matches line-ending of win, mac, and unix type
 */
const EOLS = /[^\r\n]+/g

/**
 * Helper class for the `parseChunks` function.
 */
class ParseHelper {

  private lastPos = 0     // keep the next offset to flush
  private output = true   // output state, starts "active"

  /**
   * @param source Original source
   * @param props jscc properties
   */
  constructor (private source: string, private props: JsccProps) {
  }

  /**
   * Final flush. The final output is always in "active" state.
   */
  public flush () {
    return this.commit(this.lastPos, this.source.length)
  }

  /**
   * Write pending changes.
   *
   * _IMPORTANT:_ `Parser.parse` can change the current jscc values,
   *   so this function _MUST BE_ called before the parsing to make any
   *   replacements with the current values.
   *
   * @param offset Starting position of the matched line
   */
  public flushPrev (offset: number) {
    if (this.output) {
      this.commit(this.lastPos, offset)
    }
  }

  /**
   * A line was processed, flush buffers as necessary.
   *
   * @param start Starting position of the chunk into the original buffer
   * @param end Position of the character following the chunk
   * @param output The updated output state
   * @returns The updated position where to continue the search.
   */
  public flushLine (start: number, end: number, output: boolean) {

    // Find the start of the next line in the buffer.
    if (end < this.source.length) {
      end += this.source.substr(end, 2) === '\r\n' ? 2 : 1
    }

    if (output !== this.output) {
      this.output = output
      this.flushit(start, end)

    } else if (output) {
      // flushPrev was already called, so no need to commit
      this.remove(start, end)
    }

    return end
  }

  /**
   * If the parsed `chunk` seems to contain varnames to replace, call the
   * remapVars function which will make the replacement and store the chunk
   * into the MagicString intance. Otherwise, do nothing.
   *
   * _NOTE:_ This function updates `this.lastPos`
   *
   * @param start Starting position of the chunk into the original buffer
   * @param end Position of the character following the chunk
   * @returns `true` if the chunk was changed
   */
  private commit (start: number, end: number) {

    if (start >= end) {
      return false
    }

    this.lastPos = end

    // Get the fragment of source where to search varnames to replace
    const chunk = this.source.slice(start, end)

    // Call remapVars only if a memvar prefix exists in the chunk
    return chunk.indexOf('$_') > -1 && remapVars(this.props, chunk, start)
  }

  /**
   * Removes the block from the `start` to the `end` position, inclusive.
   *
   * _NOTE:_ This function updates `this.lastPos`
   *
   * @param start Starting position of the chunk into the original buffer
   * @param end Position of the character following the chunk
   * @returns Position of the character following the removed block.
   */
  private remove (start: number, end: number) {

    this.lastPos = end

    const block = this.props.keepLines
      ? this.source.slice(start, end).replace(EOLS, '') : ''

    this.props.magicStr.overwrite(start, end, block)
  }

  /**
   * The output state changed, flush the buffer.
   *
   * @param start Start of current line
   * @param end End of current line
   */
  private flushit (start: number, end: number) {
    if (this.output) {
      // Output begins, remove previous hidden block.
      this.remove(this.lastPos, end)

    } else {
      // Output ends, flush the already processed block.
      this.commit(this.lastPos, start)
    }
  }
}

export = ParseHelper
