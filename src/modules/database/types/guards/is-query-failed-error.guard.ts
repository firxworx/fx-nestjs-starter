import { QueryFailedError } from 'typeorm'
import { DatabaseError } from 'pg-protocol'

/**
 * Type guard that confirms if the given error is a `QueryFailedError` (typeorm) & `DatabaseError` (pg-protocol).
 *
 * The error `code` property is from the postgres database driver (pg-protocol) used by node-postgres and ultimately
 * typeorm with postgres.
 *
 * This guard confirms that the given eror is a typeorm `QueryFailedError` and the property `code` (note: which can be `undefined`)
 * exists as a property (as inherited from pg-protocol `DatabaseError`).
 *
 * @param error
 * @see https://github.com/typeorm/typeorm/issues/5057
 * @see https://github.com/brianc/node-postgres/blob/ec1dcab966ecb03080e75112f6d3623d1360b634/packages/pg-protocol/src/messages.ts#L97
 * @see https://www.postgresql.org/docs/10/errcodes-appendix.html
 */
export const isQueryFailedError = (error: unknown): error is QueryFailedError & DatabaseError => {
  return error instanceof QueryFailedError && 'code' in error
}
