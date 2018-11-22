import path = require('path')

/**
 * Returns a normalized file name, relative to the current working directory.
 *
 * It returns an empty string if the received file name is falsy.
 *
 * @param fname File name to normalize
 */
export = (fname: string) => (fname ? path.relative(process.cwd(), fname).replace(/\\/g, '/') : '')
