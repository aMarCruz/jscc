import jscc from '../jscc'

/**
 * Run jscc with the given source and options and return the resulting text
 * without trimming it.
 *
 * @param code Source
 * @param opts jscc options
 */
export const preprocStr = (code: string, opts?: JsccOptions) => jscc(code, '', opts).code
