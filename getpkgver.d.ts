/**
 * Search for the package.json in the current or a parent directory that
 * contains version information.
 *
 * @returns Version string or an empty string if the info was not found.
 */
declare function getPackageVersion (): string
export = getPackageVersion
