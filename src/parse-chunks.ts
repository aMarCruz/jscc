// typings
import { Parser } from './parser'
import { ParseHelper } from './parse-helper'

/**
 * This routine search for the start of jscc directives through a buffer.
 * For each match found, calls the parser with the result of the regex and
 * the parser returns the next position from which to continue the search.
 *
 * @param parser Parser instance to use
 * @param source The original source
 * @param helper Functions to flush and remove chuncks
 */
export const parseChunks = function (parser: Parser, source: string, helper: ParseHelper) {

  let hideStart = 0             // keep the start position of the block to hide
  let lastIndex = 0             // keep the position of the next chunk to parse
  let changes   = false         // for performance, avoid generating sourceMap
  let output    = true

  const re = parser.getRegex()  // $1:keyword, $2:expression
  let match

  while ((match = re.exec(source))) {
    const index = match.index

    changes = true

    // Replace varnames in the current chunk and flush it, if necessary.
    helper.commit(lastIndex, index, output)

    if (output !== parser.parse(match)) {
      // Output state changed

      if (output) {
        // The output ends, save the position where this new
        // hidden block begins.
        hideStart = index
      }

      // Else, the output begins and the hidden block will be removed.
      // (hasOutput is initialized with `true`, so a hidden block exists)
      output = !output

    } else if (output) {
      // The output state has not changed and the output is enabled,
      // will remove the line of the processed directive.
      hideStart = index

      // Otherwise, it will be removed together with the current hidden
      // block when this ends.
    }

    lastIndex = re.lastIndex = helper.remove(hideStart, re.lastIndex, output)
  }

  // This will throw if the buffer has unbalanced blocks
  parser.close()

  // This final flush is necessary, don't delete it
  return helper.commit(lastIndex, source.length, true) || changes
}
