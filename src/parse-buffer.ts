import MagicString from 'magic-string'
import parseChunks = require('./parse-chunks')
import ParseHelper = require('./parse-helper')
import Parser = require('./parser')

import Jscc from '../index'

/**
 * Parse the received buffer and returns an object with the parsed code and its
 * sourceMap, if required by `props` and the buffer has changed.
 *
 * @param source Source code
 * @param props Parsed user options
 */
const parseBuffer = function _parseBuffer (source: string, props: JsccProps) {

  // Add a MagicString instance to the props and create the helpers.
  props.magicStr = new MagicString(source)
  const helper   = new ParseHelper(source, props)

  // Parse the buffer chunk by chunk and get the changed status.
  const changes  = parseChunks(new Parser(props), source, helper)

  // In the result, if the buffer did not change return `source` untouched.
  const result: Jscc.Result = {
    code: changes ? props.magicStr.toString() : source,
  }

  // If required, add the source map, in `null` if there were no changes.
  if (props.sourceMap) {
    result.map = changes ? props.magicStr.generateMap({
      source: props.values._FILE || undefined,
      includeContent: props.mapContent,
      hires: props.mapHires,
    }) : null
  }

  return result
}

export = parseBuffer
