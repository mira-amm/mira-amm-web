import assert from "node:assert/strict";
import { beforeEach, describe, it, mock } from "node:test";
import { Result } from "@mkvlrn/result";
import type { FetchService } from "../../../common/http/services/fetch.service.js";
import { AppError } from "../../../core/error.js";
import { GetTaskService } from "../../../features/task/services/get-task.service.js";

describe("GetTaskService", () => {
  let service: GetTaskService;
  const mockFetchService: FetchService = {
    fetch: mock.fn(),
  } as unknown as FetchService;

  beforeEach(() => {
    service = new GetTaskService(mockFetchService);
  });

  it("should return a task when fetch is successful", async () => {
    const mockTask = {
      userId: 1,
      id: 5,
      title: "Test task",
      completed: true,
    };
    const fetchSpy = mock.method(mockFetchService, "fetch", () => {
      return Result.success(mockTask);
    });

    const result = await service.getTask(5);

    assert.strictEqual(result.ok, true);
    assert.deepStrictEqual(result.value, mockTask);
    assert.strictEqual(fetchSpy.mock.callCount(), 1);
    assert.strictEqual(
      fetchSpy.mock.calls[0]?.arguments[0],
      "https://jsonplaceholder.typicode.com/todos/5",
    );
  });

  it("should return an error when fetch fails", async () => {
    const fetchSpy = mock.method(mockFetchService, "fetch", () => {
      return Result.error(new AppError("InternalError", "Network error", 418));
    });

    const result = await service.getTask(5);

    assert.strictEqual(result.ok, false);
    assert.ok(result.error instanceof AppError);
    assert.strictEqual(result.error.message, "Network error");
    assert.strictEqual(result.error.statusCode, 418);
    assert.strictEqual(fetchSpy.mock.callCount(), 1);
    assert.strictEqual(
      fetchSpy.mock.calls[0]?.arguments[0],
      "https://jsonplaceholder.typicode.com/todos/5",
    );
  });
});
