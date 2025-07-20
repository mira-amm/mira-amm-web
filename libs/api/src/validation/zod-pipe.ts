import {
  BadRequestException,
  Injectable,
  type PipeTransform,
  UsePipes,
} from "@nestjs/common";
import type {ZodSchema} from "zod";

@Injectable()
class ZodPipe implements PipeTransform {
  private schema: ZodSchema;

  constructor(schema: ZodSchema) {
    this.schema = schema;
  }

  transform(value: unknown): unknown {
    const result = this.schema.safeParse(value);

    if (!result.success) {
      const errors = result.error.issues.map((issue) => issue.message);
      throw new BadRequestException(`Validation failed: ${errors.join(", ")}`);
    }

    return result.data;
  }
}

export function Validate(schema: ZodSchema): MethodDecorator {
  return UsePipes(new ZodPipe(schema));
}
