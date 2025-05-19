import { Module } from '@nestjs/common';
import { ReadAmmController } from '../../features/read-amm/read-amm.controller.js';
import { ReadAmmService } from '../../features/read-amm/services/read-amm.service.js';

@Module({
  imports: [],
  controllers: [ReadAmmController],
  providers: [ReadAmmService],
  exports: [],
})
export class ReadAmmModule {}
