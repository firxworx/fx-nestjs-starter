import { createParamDecorator, ExecutionContext } from '@nestjs/common'
import { User } from '../entities/user.entity'

/**
 * NestJS param decorator that adds a `user` property to the `request` object that corresponds to
 * the currently authenticated user.
 */
export const GetUser = createParamDecorator((_data: unknown, ctx: ExecutionContext): User => {
  const request = ctx.switchToHttp().getRequest()
  return request.user
})
