/*
  Internal typings for TypeScript v3+
*/
interface JsccProps {
  magicStr: import('magic-string').default;
  keepLines: boolean;
  mapContent: boolean;
  mapHires: boolean;
  prefixes: string;
  sourceMap: boolean;
  values: Jscc.Values;
  errorHandler: (message: string | Error) => void;
}
