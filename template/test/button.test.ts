import { describe, expect, it } from "vitest";
import { buttonVariants } from "../src/components/ui/button/button-variants";

const classes = (props?: Parameters<typeof buttonVariants>[0]) =>
  buttonVariants(props).split(" ");

describe("buttonVariants", () => {
  it("uses the Material 3 small size by default", () => {
    expect(classes()).toEqual(
      expect.arrayContaining(["h-10", "px-4", "gap-2", "[&_svg]:size-5"]),
    );
  });

  it("has a state layer and no hover color of its own", () => {
    const list = classes();
    expect(list).toEqual(
      expect.arrayContaining([
        "before:bg-current",
        "hover:before:opacity-8",
        "focus-visible:before:opacity-10",
        "active:before:opacity-10",
      ]),
    );
    expect(list.filter((name) => name.startsWith("hover:bg-"))).toEqual([]);
  });

  it("uses the Material 3 focus ring and disabled opacity", () => {
    expect(classes()).toEqual(
      expect.arrayContaining([
        "focus-visible:outline-3",
        "focus-visible:outline-offset-2",
        "disabled:opacity-38",
      ]),
    );
  });

  it.each([
    ["xs", "h-12"],
    ["default", "h-12"],
    ["icon-xs", "size-12"],
    ["icon", "size-12"],
  ] as const)("extends the %s target to 48px", (size, target) => {
    expect(classes({ size })).toContain(`after:${target}`);
  });

  it("uses the Material 3 larger sizes", () => {
    expect(classes({ size: "md" })).toContain("h-14");
    expect(classes({ size: "lg" })).toContain("h-24");
    expect(classes({ size: "xl" })).toContain("h-34");
  });

  it("uses the destructive colors", () => {
    expect(classes({ variant: "destructive" })).toEqual(
      expect.arrayContaining(["bg-destructive", "text-on-error"]),
    );
  });
});
