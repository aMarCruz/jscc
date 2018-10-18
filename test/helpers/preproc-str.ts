import jscc from '../jscc'

export const preprocStr = (
  code: string, opts?: JsccOptions) => jscc(code, '', opts).code.replace(/\s+$/, '')
