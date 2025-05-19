import { Controller, Get, Inject } from "@nestjs/common";
import { ReadAmmService } from './services/read-amm.service.js';

@Controller('amm')
export class ReadAmmController {
private readonly readAmmService: ReadAmmService

  constructor(@Inject(ReadAmmService) readAmmService: ReadAmmService) {
    this.readAmmService = readAmmService;
  }

  @Get('id')
  async id(): Promise<string> {
    return this.readAmmService.getId();
  }

  @Get('metadata')
  async getMetadata(): Promise<any> {
    return this.readAmmService.getMetadata();
  }
}
