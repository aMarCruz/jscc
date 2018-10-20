import MagicString from 'magic-string'
import { Parser } from './parser'
import { parseChunks } from './parse-chunks'
import { ParseHelper } from './parse-helper'

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

  // Add the MagicString instance to the props as well.
  const magicStr  = props.magicStr = new MagicString(source)
  const helper    = new ParseHelper(source, props)

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
