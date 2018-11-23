// typings
import ParseHelper = require('./parse-helper')
import Parser = require('./parser')

/**
 * Handles possible error with a BOM mark in the source by replacing it with
 * an EOL (it allows the parser regex identify the start of the first line).
 *
 * The mark is preserved because, if there are replacements, the edited buffer
 * will be obtained from magicStr, which will not touch the mark, and if there
 * are not, the caller will use the original source.
 *
 * @param source The original source
 */
const withoutBOMmark = (source: string) => {
  return source.charCodeAt(0) === 0xFEFF ? '\n' + source.slice(1) : source
}

/**
 * This routine searches for the start of jscc directives through a buffer.
 * For each match found, calls the parser with the result of the regex and
 * the parser returns the next position from which to continue the search.
 *
 * @param parser jscc parser instance
 * @param source The original source
 * @param helper Functions to flush and remove chuncks
 */
const parseChunks = function _parseChunks (parser: Parser, source: string, helper: ParseHelper) {

  // Get a regex from the jscc parser to match line containing directives.
  // This regex depends on the prefixes in use and its match is handled by
  // the jscc parser, here we only care about the position of the matched line.
  const re = parser.getRegex()

  let match = re.exec(withoutBOMmark(source))

  // With `re`, there's no way for a line other than a directive to be
  // matched, so we can set a flag here to avoid a non-necessary sourcemap.
  const changes = !!match

  while (match) {

    // The parser could change the jscc varnames, so it's necessary
    // to replace any pending chunks before parsing the line.
    helper.flushPrev(match.index)

    // Parse the line and update buffers and searching position.
    // `parser.parse` returns the new output state.
    re.lastIndex = helper.flushLine(
      match.index,
      re.lastIndex,
      parser.parse(match)
    )

    // With lastIndex already updated, search the next directive.
    match = re.exec(source)
  }

  // This will throw if the buffer has unbalanced blocks
  parser.close()

  // This final flush is necessary because the source can have replacements
  // even if it does not contain directives.
  return helper.flush() || changes
}

export = parseChunks
