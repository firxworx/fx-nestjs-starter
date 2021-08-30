import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common'

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

    const statusCode = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR

    const message = exception instanceof Error ? exception.message : String(exception)
    this.logger.error(
      `<exception> status <${statusCode}> user ${request.user ? ` user <${request.user.email}>` : '<>'}: ${message}`,
    )

    response.status(statusCode).json({
      success: false,
      statusCode,
      timestamp: new Date().toISOString(),
      path: request.url,
    })
  }
}
