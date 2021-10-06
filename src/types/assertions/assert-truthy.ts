/**
 * Type assertion function that asserts that given argument is truthy.
 */
export function assertTruthy(x: unknown, errorMessage?: string): asserts x {
  if (!x) {
    throw new Error(errorMessage ?? 'Truthy assertion failed')
  }
}
