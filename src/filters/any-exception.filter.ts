import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common'
import { getErrorMessage } from 'src/common/error-helpers'

/**
 * Type guard to help identify `HttpException` responses that are ts `Record`'s.
 */
const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null
}

/**
 * Filter that logs any unhandled exceptions and ensures a standardized JSON response.
 *
 * Based on an example found in the NestJS docs for exception filters.
 *
 * @see {@link https://docs.nestjs.com/exception-filters}
 * @see {@link https://docs.nestjs.com/fundamentals/custom-providers}
 */
@Catch()
export class AnyExceptionFilter implements ExceptionFilter {
  private logger = new Logger(this.constructor.name)

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse()
    const request = ctx.getRequest()

    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR
    const message = getErrorMessage(exception)

    // refer to exceptionFactory of ValidationPipe in `main.ts`
    const exceptionResponse = exception instanceof HttpException && exception.getResponse()
    const errors =
      isRecord(exceptionResponse) && 'errors' in exceptionResponse && isRecord(exceptionResponse.errors)
        ? exceptionResponse.errors
        : undefined

    this.logger.error(
      `<exception> status <${status}>${request.user ? ` user <${request.user.email}>` : ''}: ${message}`,
    )

    response.status(status).json({
      status,
      message,
      ...({ errors } ?? {}),
      timestamp: new Date().toISOString(),
      path: request.url,
    })
  }
}
