import { Controller, Get, HttpException, Inject, Param } from "@nestjs/common";
import { type GetTaskRequest, getTaskRequestSchema } from "../../features/task/dto/get-task.request.js";
import type { GetTaskResponse } from "../../features/task/dto/get-task-response.js";
import { GetTaskService } from "../../features/task/services/get-task.service.js";
import { Validate } from "../../validation/zod-pipe.js";

@Controller("task")
export class TaskController {
  private readonly getTaskService: GetTaskService;

  constructor(@Inject(GetTaskService) getTaskService: GetTaskService) {
    this.getTaskService = getTaskService;
  }

  @Get(":id")
  @Validate(getTaskRequestSchema)
  async getTaskById(@Param() params: GetTaskRequest): Promise<GetTaskResponse> {
    const { id } = params;
    const result = await this.getTaskService.getTask(id);

    if (!result.ok) {
      throw new HttpException(result.error.message, result.error.statusCode);
    }

    return result.value;
  }
}
