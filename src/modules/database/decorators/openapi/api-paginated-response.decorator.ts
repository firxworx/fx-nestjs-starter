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
  )
}

/*
If you do not use the opt-in cli plugin for nestjs, you must:

- decorate your controller class with `@ApiExtraModels()` and pass `PaginatedResponseDto` and your
  entity/item DTO(s) as arguments.
- add `{ $ref: getSchemaPath(PaginatedResponseDto) }` to the `allOf` array under `schema`.
*/

/*
@starter consider if your app requires next/previous properties ...
  next: {
    type: 'string',
    nullable: true,
  },
  previous: {
    type: 'string',
    nullable: true,
  },
*/
