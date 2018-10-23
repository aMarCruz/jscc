import MagicString from 'magic-string'
import { Parser } from './parser'
import { parseChunks } from './parse-chunks'
import { ParseHelper } from './parse-helper'

/**
 * Returns the resulting object based in the given parameters.
 *
 * @param code Source buffer (untouched)
 * @param props jscc properties
 * @param changes `true` if the buffer has changes.
 */
const getResult = (code: string, props: JsccProps, changes: boolean): Jscc.Result => {

  // Get the processed buffer if it changed.
  if (changes) {
    code = props.magicStr.toString()
  }

  // Include a `sourceMap` property only if required.
  if (!props.sourceMap) {
    return { code }
  }

  // Return `map:null` if the buffer did not change.
  return {
    code,
    map: changes ? props.magicStr.generateMap({
      source: props.values._FILE || undefined,
      includeContent: props.mapContent,
      hires: props.mapHires,
    }) : null,
  }
}

/**
 * Parse the received buffer and returns an object with the parsed code and its
 * sourceMap, if required by `props` and the buffer has changed.
 *
 * @param source Source code
 * @param props Parsed user options
 */
export function parseBuffer (source: string, props: JsccProps) {

  // Add a MagicString instance to the props and create the helpers.
  props.magicStr = new MagicString(source)
  const helper   = new ParseHelper(source, props)

  // Parse the buffer chunk by chunk and get the changed status.
  const changes  = parseChunks(new Parser(props), source, helper)

  // Return the result with a source map if required.
  return getResult(source, props, changes)
}
