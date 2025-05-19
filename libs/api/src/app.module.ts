import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ReadAmmModule } from "./features/read-amm/read-amm.module.js";
import { TaskModule } from "./features/task/task.module.js";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ReadAmmModule,
    TaskModule
  ],
  controllers: [],
  providers: [],
  exports: [],
})
export class AppModule {}
