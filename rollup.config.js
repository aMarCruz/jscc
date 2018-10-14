import pkgjson from './package.json'

const external = Object.keys(pkgjson.dependencies).concat(['fs', 'path'])
const banner =
`/**
 * rollup-plugin-pug v${pkgjson.version}
 * @author aMarCruz'
 * @license MIT'
 */`

module.exports = {
  input: 'src/preproc.js',
  plugins: [
  ],
  external: external,
  output: [{
    file: pkgjson.main,
    format: 'cjs',
    banner,
    interop: false,
  },{
    file: pkgjson.module,
    format: 'es',
    banner,
    interop: false,
  }]
}
