import { ApiExtraModels, ApiOkResponse, ApiResponseOptions, getSchemaPath } from '@nestjs/swagger'
import { applyDecorators, Type } from '@nestjs/common'

/**
 * Custom OpenAPI/Swagger decorator to document paginated API responses.
 *
 * Returns an `ApiOkResponse()` with a custom schema.
 *
 * This method decorator requires the opt-in cli plugin for `@nextjs/swagger` to be enabled in `nest-cli.json`.
 * With the plugin enabled, `PaginatedResponseDto` and your `ItemDto` do not need to be explicitly introduced to
 * OpenAPI/Swagger by decorating your controller class with the `ApiExtraModels()` decorator from `@nestjs/swagger`.
 *
 * Usage: `@ApiPaginatedResponse<EntitySingleItemDto>(EntitySingleItemDto)`.
 *
 * Credit to @hakimio (github) + Chau Tran (nartc.me) for this approach.
 */
export const ApiPaginatedResponse = <ItemDto extends Type<unknown>>(itemDto: ItemDto, options?: ApiResponseOptions) => {
  return applyDecorators(
    // ApiQuery({ type: itemDto }),
    ApiExtraModels(itemDto),
    ApiOkResponse({
      ...(options ?? {}),
      schema: {
        allOf: [
          {
            properties: {
              count: {
                type: 'number',
              },
              data: {
                type: 'array',
                items: { $ref: getSchemaPath(itemDto) },
              },
            },
          },
        ],
      },
    }),
    // ApiQuery({ name: 'filter', type: ..., required: false }),
    // ApiQuery({ name: 'sort', type: ..., required: false }),
    // ApiQuery({ name: 'offset', type: Number, required: false }),
    // ApiQuery({ name: 'limit', type: Number, required: false }),
  )
}

// @starter consider if your app pagination requires next/previous properties ...
//   next: {
//     type: 'string',
//     nullable: true,
//   },
//   previous: {
//     type: 'string',
//     nullable: true,
//   },
