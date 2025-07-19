import {Module} from "@nestjs/common";
import {HttpModule} from "../../common/http/http.module.js";
import {GetTaskService} from "../../features/task/services/get-task.service.js";
import {TaskController} from "../../features/task/task.controller.js";

@Module({
  imports: [HttpModule],
  controllers: [TaskController],
  providers: [GetTaskService],
  exports: [],
})
export class TaskModule {}
