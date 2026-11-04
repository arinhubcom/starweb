import type { ComponentProps } from "react";

import type { IconName } from "../../../lib/fonts";
import { iconClass } from "../material-icon/icon-class";

type Props = Omit<ComponentProps<"span">, "children"> & {
  name: IconName;
  filled?: boolean;
};

// The same icon as material-icon.astro, for React islands.
export function MaterialIcon({
  name,
  filled = false,
  className,
  ...props
}: Props) {
  return (
    <span
      data-slot="material-icon"
      aria-hidden="true"
      translate="no"
      className={iconClass(filled, className)}
      {...props}
    >
      {name}
    </span>
  );
}
