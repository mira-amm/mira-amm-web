import assert from "node:assert/strict";
import {afterEach, beforeEach, describe, it, mock} from "node:test";
import {Result} from "@mkvlrn/result";
import {Test} from "@nestjs/testing";
import {GetTaskService} from "../../features/task/services/get-task.service.js";
import {TaskController} from "../../features/task/task.controller.js";

const MOCK_TASK = {userId: 1, id: 1, title: "task title", completed: false};

describe("TaskController", () => {
  describe("getTaskById", () => {
    let controller: TaskController;
    let mockGetTaskService: Partial<GetTaskService>;

    beforeEach(async () => {
      mockGetTaskService = {
        getTask: mock.fn(() => Promise.resolve(Result.success(MOCK_TASK))),
      };

      const module = await Test.createTestingModule({
        controllers: [TaskController],
        providers: [{provide: GetTaskService, useValue: mockGetTaskService}],
      }).compile();

      controller = module.get<TaskController>(TaskController);
    });

    afterEach(() => {
      mock.reset();
    });

    it("should use the service's getTask method", async () => {
      const result = await controller.getTaskById({id: 1});

      assert.deepStrictEqual(result, MOCK_TASK);
    });
  });
});
