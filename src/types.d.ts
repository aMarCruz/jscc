interface JsccProps {
  keepLines: boolean,
  mapContent: boolean,
  mapHires: boolean,
  prefixes: string,
  sourceMap: boolean,
  values: JsccValues,
  errorHandler: (message: string | Error) => void,
}
