import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common'
import type { Request, Response } from 'express'

import { User } from 'src/modules/users/entities/user.entity'

/**
 * Type guard that confirms if the type of the given argument statisfies the type: `Record<string, unknown>`.
 */
const isRecord = (x: unknown): x is Record<string, unknown> => {
  return typeof x === 'object' && x !== null
}

/**
 * Filter that logs any unhandled exceptions and returns a standardized JSON response.
 *
 * Based on an example found in the NestJS docs for exception filters.
 *
 * @starter Review this catch-all error filter and the JSON response object
 *
 * @see {@link https://docs.nestjs.com/exception-filters}
 * @see {@link https://docs.nestjs.com/fundamentals/custom-providers}
 */
@Catch()
export class AnyExceptionFilter implements ExceptionFilter {
  private logger = new Logger(this.constructor.name)

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()
    const request = ctx.getRequest<Request & { user?: Partial<User> }>()

    const httpStatus: number =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR
    const errorMessage = (exception instanceof Error && exception.message) || String(exception)
    const errorStack = exception instanceof Error ? exception.stack : undefined

    const user = request.user?.email ? request.user.email : undefined

    // refer to exceptionFactory of ValidationPipe in `main.ts` which may return a UI-friendly error object
    const httpExceptionResponse = exception instanceof HttpException ? exception.getResponse() : undefined
    const errors =
      isRecord(httpExceptionResponse) && 'errors' in httpExceptionResponse && isRecord(httpExceptionResponse.errors)
        ? httpExceptionResponse.errors
        : undefined

    this.logger.error(`Exception <${httpStatus}> <${user}>: ${errorMessage}`, errorStack)

    // @starter consider - if httpExceptionResponse is a string, you may want to return it vs. errorMessage
    response.status(httpStatus).json({
      status: httpStatus,
      message: errorMessage,
      ...(errors ? { errors } : {}),
      timestamp: new Date().toISOString(),
      path: request.url,
    })
  }
}
