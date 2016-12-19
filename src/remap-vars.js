
import { REPVARS, PROPVARS } from './revars'

// for matching all vars inside code
export default function remapVars (magicStr, values, str, start) {
  const re = REPVARS
  const prop = PROPVARS
  let mm
  let mm2
  let changes = false

  re.lastIndex = 0  // `re` is global, so reset

  // $1 = varname including the prefix '$'
  // $2 = optional point + property name

  while ((mm = re.exec(str))) {
    let v = mm[1].slice(1)
    let length = mm[1].length
    prop.lastIndex = 0
    if (v in values) {
      const p   = mm[2]
      const idx = start + mm.index

      v = values[v]

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
