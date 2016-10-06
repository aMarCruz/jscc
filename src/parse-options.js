import checkOptions from './check-options'
import { relative } from 'path'

export default function parseOptions (file, opts) {

  opts = checkOptions(opts)

  // shallow copy of the values, must be set per file
  const values = {}
  const source = opts.values

  Object.keys(source).forEach((v) => { values[v] = source[v] })

  // file is readonly and valid only for this instance
  Object.defineProperty(values, '_FILE', {
    value: file && relative(process.cwd(), file).replace(/\\/g, '/') || '',
    enumerable: true
  })

  return {
    sourceMap:    opts.sourceMap !== false,
    keepLines:    opts.keepLines,
    errorHandler: opts.errorHandler,
    prefixes:     opts.prefixes,
    values
  }
}
