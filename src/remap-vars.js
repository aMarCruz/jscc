
import { REPVARS, PROPVARS } from './revars'

const _SPLITARGS = /\s*,\s*/g
const _REPARGS = /\$(_[0-9A-Z][_0-9A-Z]*)/g

// for matching all vars inside code
export default function remapVars (magicStr, values, str, start) {
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
    let v = mm[1].slice(1)
    let length = mm[1].length
    prop.lastIndex = 0
    if (v in values) {
      const a   = mm[2]
      const p   = mm[3]
      const idx = start + mm.index

      v = values[v]

      if (a && typeof v == 'function') {
        const _repArgs = function (m, va) {
          return va in values ? values[va] : m
        }
        const args = a.split(_SPLITARGS).map(function (arg) {
          return arg.replace(_REPARGS, _repArgs)
        })

        length += a.length + 2

        v = v(args)
      }

      while ((mm2 = prop.exec(p))) {
        const p2 = mm2[1]
        if (typeof v == 'object' && p2 && p2 in v) {
          v = v[p2]
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
