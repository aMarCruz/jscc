// The characters that need to be escaped.
const R_ESCAPED = /(?=[[\](){}^$.?*+|\\])/g

/**
 * Escape special characters in a given string, in preparation to create a regex.
 *
 * @param {string} str Raw string
 * @returns {string} Escaped string.
 */
export const escapeRegex = (str: string) => str.replace(R_ESCAPED, '\\')
