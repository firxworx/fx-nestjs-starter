import { Request } from 'express'
import { User } from '../../users/entities/user.entity'

/**
 * Interface for an express `Request` with a `user` property.
 *
 * For most use-cases (e.g. in a controller) consider using the `getUser()` decorator from the
 * `Users` module.
 *
 * Usage: `async signOut(@Req() request: RequestWithUser) ...`
 */
export interface RequestWithUser extends Request {
  user: User
}
