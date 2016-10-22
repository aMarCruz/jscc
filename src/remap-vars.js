
import { REPVARS } from './revars'

// for matching all vars inside code
export default function remapVars (magicStr, values, str, start) {
  const re = REPVARS
  let mm
  let changes = false

  re.lastIndex = 0  // `re` is global, so reset

  // $1 = varname including the prefix '$'
  // $2 = optional point + property name

  while ((mm = re.exec(str))) {
    let v = mm[1].slice(1)

    if (v in values) {
      const p   = mm[2] && mm[2].slice(1)
      const idx = start + mm.index

      v = values[v]
      if (p && p in v) {
        v = v[p]
        mm[1] = mm[0]
      } else if (typeof v == 'object') {
        v = JSON.stringify(v)
      }

      magicStr.overwrite(idx, idx + mm[1].length, String(v))
      changes = true
    }
  }

  return changes
}
