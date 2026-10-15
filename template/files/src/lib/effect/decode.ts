import { Data, Effect } from "effect";
import type { z } from "zod";

export class ValidationError extends Data.TaggedError("ValidationError")<{
  error: z.ZodError;
}> {}

export const decode = <S extends z.ZodType>(
  schema: S,
  input: unknown,
): Effect.Effect<z.output<S>, ValidationError> => {
  const result = schema.safeParse(input);
  return result.success
    ? Effect.succeed(result.data)
    : Effect.fail(new ValidationError({ error: result.error }));
};
