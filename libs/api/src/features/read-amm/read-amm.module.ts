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

// import { HelloController } from "~/features/hello/hello.controller.js";
// import { HelloService } from "~/features/hello/services/hello.service.js";

// @Module({
//   imports: [],
//   controllers: [HelloController],
//   providers: [HelloService],
//   exports: [],
// })
// export class HelloModule {}
