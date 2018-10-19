import { Parser } from './parser'

/**
 * This routine search for the start of jscc directives through a buffer.
 * For each match found, calls the parser with the result of the regex and
 * the parser returns the next position from which to continue the search.
 *
 * @param source The original source
 * @param props jscc properties
 * @param flush Function to flush the chunck
 * @param remove Function to remove a chunck
 * @returns Boolean indicating if the source changed.
 */
export const parseChunks = function (
  source: string,
  props: JsccProps,
  helper: { flush: ChunkFlusher, remove: ChunkRemover }
) {
  const parser = new Parser(props)

  let changes   = false         // for performance, avoid generating sourceMap
  let hideStart = 0             // keep the start position of the block to hide
  let lastIndex = 0             // keep the position of the next chunk to parse

  const re = parser.getRegex()  // $1:keyword, $2:expression
  let match

  while ((match = re.exec(source))) {
    const index = match.index
    const hasOutput = parser.hasOutput

    // If it is neccessary, replace memvars in the current chunk and flush it
    if (hasOutput && index > lastIndex &&
        helper.flush(source.slice(lastIndex, index), lastIndex)) {
      changes = true
    }

    if (hasOutput === parser.parse(match)) {
      // The output state has not changed: if the output is enabled, remove
      // the line of the processed directive.
      // (otherwise it will removed together with the current hidden block).
      if (hasOutput) {
        re.lastIndex = helper.remove(index, re.lastIndex)
        changes = true
      }

    } else if (hasOutput) {
      // The output ends: for now, we only save the position where this new
      // hidden block begins.
      hideStart = index

    } else {
      // The output begins: remove the hidden block that we are leaving.
      // (hasOutput is initialized with `true`, so a hidden block exists)
      re.lastIndex = helper.remove(hideStart, re.lastIndex)
      changes = true
    }

    lastIndex = re.lastIndex
  }

  // This will throw if the buffer has unbalanced blocks
  parser.close()

  // This final flush is necessary, don't delete it
  if (parser.hasOutput && source.length > lastIndex &&
      helper.flush(source.slice(lastIndex), lastIndex)) {
    changes = true
  }

  return changes
}
