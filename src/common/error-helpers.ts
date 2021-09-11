/**
 * Return a string representation of the given error of type `unknown`.
 *
 * Returns the error `message` property value if the given error is an instance of `Error`.
 *
 * Intended for use in a catch blocks. Note `ValidationError` has a different arrangement and `message` can be an array of strings.
 *
 * @param error unknown error
 */
export const getErrorMessage = (error: unknown) => {
  return (error && error instanceof Error && error.message) || String(error)
}

/**
 * Return the error stack (or `undefined`) from the given error of type `unknown`.
 *
 * Returns the error `stack` property value if the given error is an instance of `Error`.
 *
 * Intended for use in a catch blocks and with logging functions.
 *
 * @param error unknown error
 */
export const getErrorStack = (error: unknown) => {
  return (error && error instanceof Error && error.stack) || undefined
}
