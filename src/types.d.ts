/*
  Internal typings for TypeScript v3+
*/

interface JsccProps {
  keepLines: boolean;
  mapContent: boolean;
  mapHires: boolean;
  prefixes: string;
  sourceMap: boolean;
  values: JsccValues;
  errorHandler: (message: string | Error) => void;
}

interface ChunkFlusher {
  (str: string, start: number): number | boolean;
}

interface ChunkRemover {
  (start: number, end: number): number;
}
