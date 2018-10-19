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
  flush: ChunkFlusher,
  remove: ChunkRemover
) {
  const parser = new Parser(props)

  let changes     = false       // for performance, avoid generating sourceMap
  let hasOutput   = true        // the output state of the parser starts `true`
  let hideStart   = 0           // keep the start position of the block to hide
  let lastIndex   = 0           // keep the position of the next chunk to parse

  const re = parser.getRegex()  // $1:keyword, $2:expression
  let match = re.exec(source)

  while (match) {
    const index = match.index

    // If it is neccessary, replace memvars in the current chunk and flush it
    if (hasOutput && lastIndex < index) {
      if (flush(source.slice(lastIndex, index), lastIndex)) {
        changes = true
      }
    }

    lastIndex = re.lastIndex

    if (hasOutput === parser.parse(match)) {
      // The output state has not changed: if the output is enabled, remove
      // the line of the processed directive.
      // (otherwise it will removed together with the current hidden block).
      if (hasOutput) {
        lastIndex = re.lastIndex = remove(index, lastIndex)
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
      lastIndex = re.lastIndex = remove(hideStart, lastIndex)
    }

    match = re.exec(source)
  }

  // This will throw if the buffer has unbalanced blocks
  parser.close()

  if (hasOutput && source.length > lastIndex &&
      flush(source.slice(lastIndex), lastIndex)) {
    changes = true
  }

  // always returns an object
  return changes
}
