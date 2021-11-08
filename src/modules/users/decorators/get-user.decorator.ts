import { createParamDecorator, ExecutionContext } from '@nestjs/common'
import { User } from '../entities/user.entity'

/**
 * NestJS param decorator that returns the value of the `user` property as added to the
 * `request` object by a PassportJS strategy when a user is authenticated.
 */
export const GetUser = createParamDecorator((_data: unknown, ctx: ExecutionContext): User => {
  const request = ctx.switchToHttp().getRequest()
  return request.user
})
