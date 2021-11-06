/**
 * Process a boolean environment value from `process.env` (with `_FLAG` suffix per project convention)
 * and return `true` if the value is '1' and `false` in all other cases.
 */
export const envFlagValue = (envVar: string | undefined): boolean => Number(envVar ?? 0) === 1

export const envNumberValue = (envVar: string | undefined): number | undefined => {
  if (typeof envVar === 'undefined') {
    return undefined
  }

  const numberValue = Number(envVar)

  if (isNaN(numberValue)) {
    throw new Error('Failed to validate optional numerical environment variable value')
  }

  return numberValue
}
