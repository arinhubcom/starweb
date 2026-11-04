import { tv, type VariantProps } from "tailwind-variants";

// Styles and sizes follow rules/MATERIAL.md (States, Motion, Buttons, Icon
// buttons). The radius comes from the Fulldev UI theme, the font from
// src/lib/fonts.ts.
export const buttonVariants = tv({
  base: [
    "group/button relative inline-flex shrink-0 items-center justify-center rounded-md border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap select-none in-data-[slot=button-group]:rounded-md aria-invalid:border-destructive",
    // State layer: an overlay in the content color, never a new container color.
    "before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:bg-current before:opacity-0 before:transition-opacity before:duration-150 before:ease-standard hover:before:opacity-8 focus-visible:before:opacity-10 active:before:opacity-10",
    "outline-ring focus-visible:outline-3 focus-visible:outline-offset-2",
    "disabled:pointer-events-none disabled:opacity-38",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_.icon]:pointer-events-none",
  ],
  variants: {
    variant: {
      default: "bg-primary text-primary-foreground",
      outline: "border-input bg-transparent text-foreground",
      secondary: "bg-secondary text-secondary-foreground",
      ghost: "bg-transparent text-foreground",
      destructive: "bg-destructive text-on-error",
      link: "bg-transparent text-primary underline-offset-4 hover:underline",
    },
    size: {
      // The 48x48px target of the smaller sizes comes from a transparent ::after.
      // A fixed size, because insets start at the padding box, inside the border.
      xs: "h-8 gap-2 px-4 after:absolute after:inset-x-0 after:top-1/2 after:h-12 after:-translate-y-1/2 [&_svg]:size-5 [&_.icon]:text-xl",
      sm: "h-10 gap-2 px-4 after:absolute after:inset-x-0 after:top-1/2 after:h-12 after:-translate-y-1/2 [&_svg]:size-5 [&_.icon]:text-xl",
      default:
        "h-10 gap-2 px-4 after:absolute after:inset-x-0 after:top-1/2 after:h-12 after:-translate-y-1/2 [&_svg]:size-5 [&_.icon]:text-xl",
      md: "h-14 gap-2 px-6 [&_svg]:size-6 [&_.icon]:text-2xl",
      lg: "h-24 gap-3 px-12 [&_svg]:size-8 [&_.icon]:text-[2rem]",
      xl: "h-34 gap-4 px-16 [&_svg]:size-10 [&_.icon]:text-[2.5rem]",
      "icon-xs":
        "size-8 after:absolute after:top-1/2 after:left-1/2 after:size-12 after:-translate-x-1/2 after:-translate-y-1/2 [&_svg]:size-5 [&_.icon]:text-xl",
      "icon-sm":
        "size-10 after:absolute after:top-1/2 after:left-1/2 after:size-12 after:-translate-x-1/2 after:-translate-y-1/2 [&_svg]:size-6 [&_.icon]:text-2xl",
      icon: "size-10 after:absolute after:top-1/2 after:left-1/2 after:size-12 after:-translate-x-1/2 after:-translate-y-1/2 [&_svg]:size-6 [&_.icon]:text-2xl",
      "icon-md": "size-14 [&_svg]:size-6 [&_.icon]:text-2xl",
      "icon-lg": "size-24 [&_svg]:size-8 [&_.icon]:text-[2rem]",
      "icon-xl": "size-34 [&_svg]:size-10 [&_.icon]:text-[2.5rem]",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "default",
  },
});

export type ButtonVariantProps = VariantProps<typeof buttonVariants>;
