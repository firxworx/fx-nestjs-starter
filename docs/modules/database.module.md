# DatabaseModule

The `DatabaseModule` found in `src/modules/database` implements a few goodies for working with typeorm + postgres in the context of a NestJS API.

## Tools for Pagination & Filters

Inside the module folder, refer to: 

- `decorators/`
  - `api-paginated-response.decorator.ts` implements a decorator that can be applied to controller methods to help document paginated responses with OpenAPI/Swagger.
- `dto/`
  -`paginated-response.dto.ts` implements a generic `PaginatedResponseDto` for API responses that include a typed `data` array and a record `count`
- `pipes/`
  - `page-filter-sort-query-validation.pipe.ts` implements a custom validation pipe that extends NestJS' `PipeTransform` class that can be used by controller methods to validate query strings that specify sort and filter params. Refer to the doc comment in the code for more details and a usage example.
