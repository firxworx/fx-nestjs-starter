import { Test, TestingModule } from '@nestjs/testing'
import { QueryUtilsService } from './query-utils.service'

describe('QueryUtilsService', () => {
  let service: QueryUtilsService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [QueryUtilsService],
    }).compile()

    service = module.get<QueryUtilsService>(QueryUtilsService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
