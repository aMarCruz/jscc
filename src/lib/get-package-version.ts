import { join } from 'path'

/**
 * Returns the version on package.json.
 *
 * @param path Current or some parent path
 */
const extractVersion = (path: string) => {

  // Try to get the version, the package may not contain one.
  try {
    const pkgname = join(path, 'package.json')
    return require(pkgname).version as string
  } catch { /**/ }

  return ''
}

/**
 * Get the version of the package.json in the current or one of the parents
 * directories.
 *
 * If the received parameter is an string, returns it as the version.
 *
 * @param {any} [version] Already defined version
 * @returns {string} Package version, or empty if it could not be found.
 */
export const getPackageVersion = (version: string) => {

  // Keep any already defined user version
  if (version && typeof version == 'string') {
    return version
  }

  // Start with the current working directory, with normalized slashes
  let path = process.cwd().replace(/\\/g, '/')
  version = ''

  while (~path.indexOf('/')) {

    version = extractVersion(path)
    if (version) {
      break
    }

    // package.json not found or does not contains version, move up
    path = path.replace(/\/[^/]*$/, '')
  }

  return version
}
