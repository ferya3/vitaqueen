import { cva } from 'class-variance-authority';

/**
 * shadcn/ui-style button: one `cva` recipe, `asChild` to render the styles on
 * a link or any other element through Radix `Slot`.
 *
 * `sheen` is the slow highlight that crosses the button on hover — the "water"
 * tell on the public site. It is a pseudo-element, so it survives `asChild`.
 */
export const buttonVariants = cva(
  'group relative inline-flex shrink-0 items-center justify-center gap-2 overflow-hidden whitespace-nowrap rounded-pill font-semibold outline-none transition-[background-color,border-color,color,box-shadow,transform] duration-(--duration-fast) focus-visible:ring-2 focus-visible:ring-aqua-400 focus-visible:ring-offset-2 focus-visible:ring-offset-ground-50 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        // The one saturated fill in the system. Everything else defers to it.
        primary: 'bg-aqua-500 text-white shadow-float hover:bg-aqua-600 active:translate-y-px',
        // Glass, so it sits on the aurora instead of punching a hole in it.
        secondary: 'glass text-heading hover:-translate-y-0.5 hover:shadow-float active:translate-y-0',
        ghost: 'text-ink-700 hover:bg-ink-900/6 hover:text-heading',
        light: 'bg-white text-heading shadow-press hover:bg-ground-50',
        outline: 'border border-ink-200 bg-white text-ink-800 hover:border-aqua-400 hover:text-aqua-800',
        destructive: 'bg-red-600 text-white hover:bg-red-700',
        // For dark, immersive grounds: a thin frosted outline that lets the
        // depth show through.
        glass: 'border border-white/20 bg-white/[0.06] text-white backdrop-blur-md hover:border-white/40 hover:bg-white/12',
        // The primary fill, brighter, for use on the abyss.
        bright: 'bg-aqua-300 text-abyss-950 shadow-glow hover:bg-aqua-200 active:translate-y-px',
      },
      size: {
        sm: 'h-9 px-4 text-sm',
        md: 'h-11 px-6 text-sm',
        lg: 'h-13 px-7 text-base',
        icon: 'size-9',
      },
      sheen: {
        true: 'before:pointer-events-none before:absolute before:inset-0 before:-translate-x-full before:bg-gradient-to-r before:from-transparent before:via-white/25 before:to-transparent before:transition-transform before:duration-700 before:ease-[cubic-bezier(0.22,1,0.36,1)] hover:before:translate-x-full motion-reduce:before:hidden',
        false: '',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md', sheen: false },
  },
);
