/**
 * Enum containing valid SQL `ORDER BY` values.
 *
 * Can be used in conjunction with `@IsEnum()` decorator from `class-validator` in query-related DTOs.
 */
export enum SqlOrder {
  ASC = 'ASC',
  DESC = 'DESC',
}
