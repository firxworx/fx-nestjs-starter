import { PipeTransform, Injectable, ArgumentMetadata, BadRequestException } from '@nestjs/common'
import { ObjectSchema } from 'joi'

/**
 * Custom validation pipe that leverages the joi validation library, based on the example from the nestjs docs.
 * The constructor accepts a joi `ObjectSchema`. This pipe is useful for validating plain objects.
 *
 * Usage: invoke the `JoiValidationPipe` using the `@UsePipes` decorator:
 *
 * ```ts
 * @UsePipes(new JoiValidationPipe(joiValidationSchema))
 * ```
 *
 * @see https://joi.dev/
 * @see https://docs.nestjs.com/pipes
 */
@Injectable()
export class JoiValidationPipe implements PipeTransform {
  constructor(private schema: ObjectSchema) {}

  transform(value: any, _metadata: ArgumentMetadata) {
    const { error } = this.schema.validate(value)

    if (error) {
      // throw new BadRequestException(error.details[0].message)
      throw new BadRequestException('Validation failed')
    }

    return value
  }
}

/*
@UsePipes(new JoiValidationPipe(createCatSchema))
*/
