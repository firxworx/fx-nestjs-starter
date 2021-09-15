import { PaginationParamsAbstractDto } from '../../database/dto/pagination-params.abstract.dto'
import { User } from '../entities/user.entity'

export class PaginatedUsersRequestDto extends PaginationParamsAbstractDto<User> {}
