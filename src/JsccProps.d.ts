/*
  Internal props structure.
*/
interface JsccProps {
  magicStr: import('magic-string').default
  escapeQuotes: number,
  keepLines: boolean
  mapContent: boolean
  mapHires: boolean
  prefixes: string
  sourceMap: boolean
  values: import('../index').Values
  errorHandler: (message: string | Error) => void
}
