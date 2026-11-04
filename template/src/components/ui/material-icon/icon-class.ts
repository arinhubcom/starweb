import { cn } from "../../../lib/utils";

// The .icon and .icon-filled classes are in src/styles/global.css.
export const iconClass = (filled: boolean, className?: unknown) =>
  cn("icon", filled && "icon-filled", className as string | undefined);
