import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { iconClass } from "../src/components/ui/material-icon/icon-class";
import { MaterialIcon } from "../src/components/ui/react/material-icon";

describe("iconClass", () => {
  it("adds the fill class only for a filled icon", () => {
    expect(iconClass(false)).toBe("icon");
    expect(iconClass(true)).toBe("icon icon-filled");
  });

  it("keeps a class from the caller", () => {
    expect(iconClass(false, "text-xl")).toBe("icon text-xl");
  });
});

describe("React MaterialIcon", () => {
  it("renders a decorative icon that the browser does not translate", () => {
    expect(
      renderToStaticMarkup(createElement(MaterialIcon, { name: "search" })),
    ).toBe(
      '<span data-slot="material-icon" aria-hidden="true" translate="no" class="icon">search</span>',
    );
  });

  it("passes the fill, the class, and other props", () => {
    const html = renderToStaticMarkup(
      createElement(MaterialIcon, {
        name: "search",
        filled: true,
        className: "text-xl",
        id: "find",
      }),
    );
    expect(html).toContain('class="icon icon-filled text-xl"');
    expect(html).toContain('id="find"');
  });
});
