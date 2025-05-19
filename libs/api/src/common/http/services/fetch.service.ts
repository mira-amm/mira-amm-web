import { Result } from "@mkvlrn/result";
import { Injectable } from "@nestjs/common";
import type { ZodSchema } from "zod";
import { AppError } from "../../../core/error.js";

@Injectable()
export class FetchService {
  async fetch<T>(url: string, schema: ZodSchema<T>): Promise<Result<T, AppError>> {
    try {
      const response = await fetch(url);

      if (!response.ok) {
        return await this.errorEarly(response);
      }

      return await this.validateResponse(schema, response);
    } catch (error) {
      return Result.error(
        new AppError(
          "InternalError",
          `An error occurred while fetching data: ${(error as Error).message}`,
          500,
        ),
      );
    }
  }

  private async errorEarly(response: Response): Promise<Result<never, AppError>> {
    const errorText = await response.text();
    switch (response.status) {
      case 404:
        return Result.error(new AppError("NotFoundError", `Resource not found: ${errorText}`, 404));
      default:
        return Result.error(
          new AppError("InternalError", `An error occurred while fetching data: ${errorText}`, 500),
        );
    }
  }

  private async validateResponse<T>(
    schema: ZodSchema<T>,
    response: Response,
  ): Promise<Result<T, AppError>> {
    const value = await response.json();
    const result = schema.safeParse(value);

    if (!result.success) {
      return Result.error(new AppError("BadGateway", "Bad data received from source", 502));
    }

    return Result.success(result.data);
  }
}
