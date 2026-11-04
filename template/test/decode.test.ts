import { Effect } from "effect";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { decode, ValidationError } from "../src/lib/effect/decode";

const schema = z.object({ name: z.string() });

describe("decode", () => {
  it("returns the parsed value for valid input", async () => {
    await expect(
      Effect.runPromise(decode(schema, { name: "a" })),
    ).resolves.toEqual({ name: "a" });
  });

  it("fails with ValidationError for invalid input", async () => {
    const error = await Effect.runPromise(
      Effect.flip(decode(schema, { name: 1 })),
    );
    expect(error).toBeInstanceOf(ValidationError);
  });
});
