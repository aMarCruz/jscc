import { Parser } from './parser'

type Helper = {
  flush: ChunkFlusher;
  remove: ChunkRemover;
}

/**
 * This routine search for the start of jscc directives through a buffer.
 * For each match found, calls the parser with the result of the regex and
 * the parser returns the next position from which to continue the search.
 *
 * @param parser Parser instance to use
 * @param source The original source
 * @param helper Functions to flush and remove chuncks
 */
export const parseChunks = function (parser: Parser, source: string, helper: Helper) {

  let hideStart = 0             // keep the start position of the block to hide
  let lastIndex = 0             // keep the position of the next chunk to parse
  let changes   = false         // for performance, avoid generating sourceMap
  let output    = true

  const re = parser.getRegex()  // $1:keyword, $2:expression
  let match

  while ((match = re.exec(source))) {
    const index = match.index

    changes = true

    // If it is neccessary, replace memvars in the current chunk and flush it
    if (output && index > lastIndex) {
      helper.flush(source.slice(lastIndex, index), lastIndex)
    }

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

      // Otherwise it will removed together with the current hidden block
      // when this hidden block ends.
    }

    lastIndex = output
      ? (re.lastIndex = helper.remove(hideStart, re.lastIndex)) : re.lastIndex
  }

  // This will throw if the buffer has unbalanced blocks
  parser.close()

  // This final flush is necessary, don't delete it
  return output && source.length > lastIndex &&
    helper.flush(source.slice(lastIndex), lastIndex) || changes
}
