/*
  jscc v1.0

  @author aMarCruz
  @license MIT
*/
export = Jscc

/**
 * Preprocessor for conditional comments and compile-time variable
 * replacement replacement in text files (asynchronous version).
 *
 * @param source String to be preprocessed, encoded in utf8.
 * @param filename Absolute or relative path to the current directory.
 * @param options User options.
 * @param callback NodeJS style callback that receives the error and result as parameters.
 */
declare function Jscc (
  source: string,
  filename: string | null | undefined,
  options: Jscc.Options | null | undefined,
  callback: Jscc.Callback
): void

/**
 * Preprocessor for conditional comments and compile-time variable
 * replacement replacement in text files (synchronous version).
 *
 * @param source String to be preprocessed, encoded in utf8.
 * @param filename Absolute or relative path to the current directory.
 * @param options User options.
 * @returns Object with `code` and `map` properties.
 */
declare function Jscc (
  source: string,
  filename?: string | null,
  options?: Jscc.Options | null
): Jscc.Result

// tslint:disable:no-namespace
declare namespace Jscc {

  type QuoteType = 'single' | 'double' | 'both'

  interface Options {
    /**
     * String with the type of quotes to escape in the output of strings:
     * 'single', 'double' or 'both'.
     *
     * It does not affects the output of regexes or strings contained in the
     * JSON output of objects.
     */
    escapeQuotes?: QuoteType

    /**
     * Allows to preserve the empty lines of the directives and blocks that
     * were removed.
     *
     * Use this option with `sourceMap:false` if you are only interested in
     * keeping the line count.
     *
     * @default false
     */
    keepLines?: boolean

    /**
     * Include the original source in the sourceMap.
     *
     * @default false
     */
    mapContent?: boolean

    /**
     * Makes a hi-res sourceMap.
     *
     * @default true
     */
    mapHires?: boolean

    /**
     * String, regex or array of strings or regex matching the start of a directive.
     * That is, the characters before the '#', usually the start of comments.
     *
     * @default ['//','/*','<!--']
     */
    prefixes?: string | RegExp | Array<string | RegExp>

    /**
     * Set this option to `false` to suppress source map generation.
     *
     * _Note:_ In plugins like rollup-plugin-jscc or jscc-brunch, this option
     * should take its value from equivalent property of the parent tool.
     * @default true
     */
    sourceMap?: boolean
    /**
     * Plain object defining the variables used by jscc during the preprocessing.
     *
     * Each key is a varname matching the regex `_[0-9A-Z][_0-9A-Z]*`, the value
     * can have any type.
     *
     * It has two predefined, readonly properties:
     * - `_FILE` : Name of the source file, relative to the current directory
     * - `_VERSION` : The version property in the package.json
     */
    values?: { [k: string]: any }
  }

  /**
   * The result always will be an object with a `code` property and, if
   * `sourceMap` is required (the default), a `map` property with a raw
   * sourceMap, or `null` if the buffer did not change.
   *
   * If `sourceMap` is not required, the `map` property is ommited.
   */
  interface Result {
    code: string
    map?: import('magic-string').SourceMap | null
  }

  /** Callback for async operation */
  type Callback = (error: Error | null, data?: Jscc.Result) => void

  interface Values {
    [k: string]: any
    _VERSION: string
    _FILE: string
  }

}
