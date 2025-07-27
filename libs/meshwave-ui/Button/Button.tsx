import {cn} from "@/shadcn-ui/utils";
import * as React from "react";
import {Slot} from "@radix-ui/react-slot";
import {cva, type VariantProps} from "class-variance-authority";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm  transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring hover:cursor-pointer disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-accent-primary text-old-mira-text border border-accent-primary hover:bg-accent-primary-1 dark:hover:bg-old-mira-active-btn cursor-pointer",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline:
          "text-black dark:text-accent-primary bg-transparent hover:bg-background-grey-light border border-black dark:border-accent-primary hover:shadow-none active:bg-transparent",
        secondary:
          "bg-accent-dimmed text-accent-primary border-none shadow-none hover:bg-old-mira-bg-hover active:bg-old-mira-bg-active cursor-pointer",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-lg px-3 text-xs",
        xs: "h-7 rounded-lg px-3 text-xs",
        lg: "h-10 rounded-lg px-8",
        icon: "h-9 w-9",
        xl: "h-11",
        "2xl": "py-4",
      },
      block: {
        true: "w-full",
      },
      disabled: {
        true: "bg-background-secondary border-background-secondary border-black dark:text-content-dimmed-dark text-content-tertiary shadow-none hover:bg-background-secondary disabled:opacity-50",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {className, variant, size, block, disabled, asChild = false, ...props},
    ref
  ) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(
          buttonVariants({variant, size, block, disabled, className})
        )}
        disabled={disabled}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export {Button, buttonVariants};
