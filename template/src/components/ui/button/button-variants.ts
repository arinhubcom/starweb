import { tv, type VariantProps } from "tailwind-variants";

// Styles follow rules/MATERIAL.md (Style states, Animate, Buttons). The radius comes from the Fulldev UI theme, the font from
// src/lib/fonts.ts.
export const buttonVariants = tv({
  base: [
    "group/button relative inline-flex shrink-0 items-center justify-center rounded-md border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap select-none in-data-[slot=button-group]:rounded-md aria-invalid:border-destructive",
    // State layer: an overlay in the content color, never a new container color.
    // Every component gets the same state layer in the `base` of its `tv()`. An
    // installed component loses its own hover color.
    "before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:bg-current before:opacity-0 before:transition-opacity before:duration-150 before:ease-standard hover:before:opacity-8 focus-visible:before:opacity-10 active:before:opacity-10",
    // Focus ring: 3px wide, 2px offset, in the theme color `outline-ring`.
    "outline-ring focus-visible:outline-3 focus-visible:outline-offset-2",
    // Disabled is 38% with no state layer. It replaces the shadcn/ui
    // `disabled:opacity-50`.
    "disabled:pointer-events-none disabled:opacity-38",
    "[&_.icon]:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0",
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
      xs: "h-8 gap-2 px-4 after:absolute after:inset-x-0 after:top-1/2 after:h-12 after:-translate-y-1/2 [&_.icon]:text-xl [&_svg]:size-5",
      sm: "h-10 gap-2 px-4 after:absolute after:inset-x-0 after:top-1/2 after:h-12 after:-translate-y-1/2 [&_.icon]:text-xl [&_svg]:size-5",
      default:
        "h-10 gap-2 px-4 after:absolute after:inset-x-0 after:top-1/2 after:h-12 after:-translate-y-1/2 [&_.icon]:text-xl [&_svg]:size-5",
      md: "h-14 gap-2 px-6 [&_.icon]:text-2xl [&_svg]:size-6",
      lg: "h-24 gap-3 px-12 [&_.icon]:text-[2rem] [&_svg]:size-8",
      xl: "h-34 gap-4 px-16 [&_.icon]:text-[2.5rem] [&_svg]:size-10",
      "icon-xs":
        "size-8 after:absolute after:top-1/2 after:left-1/2 after:size-12 after:-translate-x-1/2 after:-translate-y-1/2 [&_.icon]:text-xl [&_svg]:size-5",
      "icon-sm":
        "size-10 after:absolute after:top-1/2 after:left-1/2 after:size-12 after:-translate-x-1/2 after:-translate-y-1/2 [&_.icon]:text-2xl [&_svg]:size-6",
      icon: "size-10 after:absolute after:top-1/2 after:left-1/2 after:size-12 after:-translate-x-1/2 after:-translate-y-1/2 [&_.icon]:text-2xl [&_svg]:size-6",
      "icon-md": "size-14 [&_.icon]:text-2xl [&_svg]:size-6",
      "icon-lg": "size-24 [&_.icon]:text-[2rem] [&_svg]:size-8",
      "icon-xl": "size-34 [&_.icon]:text-[2.5rem] [&_svg]:size-10",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "default",
  },
});

export type ButtonVariantProps = VariantProps<typeof buttonVariants>;
