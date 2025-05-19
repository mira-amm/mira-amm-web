import type { HttpStatus } from "@nestjs/common";

type AppErrorName = "NotFoundError" | "InternalError" | "BadGateway";

export class AppError extends Error {
  readonly statusCode: HttpStatus;

  constructor(name: AppErrorName, message: string, statusCode: HttpStatus) {
    super(message);
    this.name = name;
    this.statusCode = statusCode;
  }
}
