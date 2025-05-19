import { Query, Resolver } from '@nestjs/graphql';
import { Inject } from "@nestjs/common";
import { ReadAmmService } from '../services/read-amm.service.js';
import { AmmMetadata } from '../dto/amm-metadata.graphql.js'

@Resolver()
export class ReadAmmResolver {
private readonly readAmmService: ReadAmmService

  constructor(@Inject(ReadAmmService) readAmmService: ReadAmmService) {
    this.readAmmService = readAmmService;
  }

  @Query(() => String)
  getAmmId() {
    return this.readAmmService.getId();
  }

  @Query(()=>AmmMetadata)
  async getAmmMetadata() {
    return this.readAmmService.getMetadata();
  }
}
