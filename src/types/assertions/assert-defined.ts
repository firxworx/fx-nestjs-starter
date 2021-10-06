/**
 * Type assertion function that asserts the given argument is `NonNullable`
 * (i.e. that it is not `undefined` and not `null`).
 */
export function assertDefined<T>(x: T, errorMessage?: string): asserts x is NonNullable<T> {
  if (x === undefined || x === null) {
    throw new Error(errorMessage ?? 'Non-nullable assertion failed')
  }
}
