/*
  Type definitions for jscc v1.1.1
  @license MIT
*/
export = Jscc

/**
 * Preprocessor for conditional comments and replacement of compile-time
 * variables in text files (asynchronous version).
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
 * Preprocessor for conditional comments and replacement of compile-time
 * variables in text files (synchronous version).
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
     * It does not affects the strings contained in the JSON output of
     * objects.
     */
    escapeQuotes?: QuoteType

    /**
     * Allows to preserve the empty lines of directives and blocks that
     * were removed.
     *
     * Use this option with `sourceMap:false` if you are interested only in
     * preserve the line count.
     *
     * @default false
     */
    keepLines?: boolean

    /**
     * Include the original source in the sourcemap.
     *
     * @default false
     */
    mapContent?: boolean

    /**
     * Makes a hi-res sourcemap.
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
     * Set this option to `false` to suppress the creation of the sourcemap.
     *
     * _Note:_ In plugins such as jscc-brunch, this option will take the value
     * given by the main tool, unless it is explicity defined as `false`
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
   * The result
   */
  interface Result {
    /**
     * Processed source text.
     */
    code: string
    /**
     * Raw sourcemap object, or `null` if the buffer did not change.
     */
    map?: import('magic-string').SourceMap | null
  }

  /** Callback for async operation */
  type Callback = (error: Error | null, data?: Jscc.Result) => void

  /** jscc varnames and values */
  interface Values {
    [k: string]: any
    _VERSION: string
    _FILE: string
  }
}
