import buble from 'rollup-plugin-buble'
var external = ['fs', 'path', 'magic-string']

module.exports = {
  entry: 'src/preproc.js',
  plugins: [
    buble()
  ],
  external: external,
  interop: false
}
