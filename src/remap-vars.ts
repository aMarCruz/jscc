import { REPVARS, PROPVARS } from './revars'
import MagicString from 'magic-string'

const _SPLITARGS = /\s*,\s*/g
const _REPARGS = /\$(_[0-9A-Z][_0-9A-Z]*)/g

// for matching all vars inside code
export default function remapVars (magicStr: MagicString, values: JsccValues, str: string, start: number) {
  const re = REPVARS
  const prop = PROPVARS
  let mm
  let mm2
  let changes = false

  re.lastIndex = 0  // `re` is global, so reset

  // $1 = varname including the prefix '$'
  // $2 = arguments
  // $3 = optional point + property name

  while ((mm = re.exec(str))) {
    let vname = mm[1].slice(1)
    let length = mm[1].length

    prop.lastIndex = 0

    if (vname in values) {
      const a   = mm[2]
      const p   = mm[3]
      const idx = start + mm.index

      let v = values[vname]

      if (a && typeof v == 'function') {
        const fn = v as (args: string[]) => any
        const _repArgs = (m: string, va: string) => va in values ? String(values[va]) : m
        const args = a.split(_SPLITARGS).map((arg) => arg.replace(_REPARGS, _repArgs))

        length += a.length + 2

        v = fn(args)
      }

      while ((mm2 = prop.exec(p))) {
        const p2 = mm2[1]
        if (p2 && typeof v == 'object' && v && p2 in v) {
          v = (v as any)[p2]
          length += p2.length + 1
        }
      }

      if (typeof v == 'object') {
        v = JSON.stringify(v)
      }

      magicStr.overwrite(idx, idx + length, String(v))
      changes = true
    }
  }

  return changes
}
