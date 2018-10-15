import { join } from 'path'

/**
 * Get the version of the package.json in the current or one of the parents
 * directories.
 *
 * If the received parameter is an string, returns it as the version.
 *
 * @param {any} [version] Already defined version
 * @returns {string} Package version, or empty if it could not be found.
 */
export const getPackageVersion = (version?: string) => {

  // keep already defined version, if any
  if (version && typeof version == 'string') {
    return version
  }

  // start with the current working directory, with normalized slashes
  let path = process.cwd().replace(/\\/g, '/')

  // search up to the root
  while (~path.indexOf('/')) {
    try {
      const pkgname = join(path, 'package.json')
      const pkgjson = require(pkgname)

      if (pkgjson.version) {
        return pkgjson.version
      }
    } catch { /**/ }

    // package.json not found or does not contains version, move up
    path = path.replace(/\/[^/]*$/, '')
  }

  return ''
}
