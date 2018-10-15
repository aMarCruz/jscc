interface JsccProps {
  keepLines: boolean,
  mapContent: boolean,
  mapHires: boolean,
  prefixes: string,
  sourceMap: boolean,
  values: {
    [k: string]: string,
    _VERSION: string,
    _FILE: string,
  },
  errorHandler: (message: string) => void,
}
