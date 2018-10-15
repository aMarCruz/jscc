interface JsccOptions {
  /**
   * Allows to preserve the empty lines of the directives and blocks that were
   * removed.
   *
   * Use this option with `sourceMap:false` if you are only interested in
   * keeping the line count.
   * @default false
   */
  keepLines?: boolean,
  /**
   * Include the original source in the sourceMap.
   */
  mapContent?: boolean,
  /**
   * Make a hi-res sourceMap.
   */
  mapHires?: boolean,
  /**
   * String or array of strings with sequences that starts a directive.
   * That is, the characters before the pound sign, usually the start of comments.
   * @default ['//','/*','<!--']
   */
  prefixes?: string | RegExp | Array<string | RegExp>,
  /**
   * Set this option to `false` to suppress source map generation.
   *
   * _Note:_ In plugins like rollup-plugin-jscc or jscc-brunch, this option
   * should take its value from equivalent property of the parent tool.
   * @default true
   */
  sourceMap?: boolean,
  /**
   * Plain object defining the variables used by jscc during the preprocessing.
   *
   * Each key is a varname matching the regex `_[0-9A-Z][_0-9A-Z]*`, the value
   * can have any type.
   *
   * It has two predefined varnames: `_FILE` and `_VERSION`.
   */
  values?: { [k: string]: string },
  /**
   * Error handler. The default implementation throws an exception.
   */
  errorHandler?: (message: string) => never,
}

interface JsccParserResult {
  code: string,
  map?: import('magic-string').SourceMap,
}

type JsccValidTypes = number | string | boolean | Date | RegExp | null

interface JsccValues {
  [k: string]: JsccValidTypes,
  _VERSION: string,
  _FILE: string
}
