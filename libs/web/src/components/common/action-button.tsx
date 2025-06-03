import {clsx} from "clsx";
import {forwardRef, ReactNode, useCallback} from "react";

import {Loader} from "@/src/components/common";

type ButtonType = "button" | "submit" | "reset";
type ButtonVariant = "primary" | "secondary" | "outlined";

type Props = {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
  loading?: boolean;
  completed?: boolean;
  type?: ButtonType;
  variant?: ButtonVariant;
  fullWidth?: boolean;
};

export const ActionButton = forwardRef<HTMLButtonElement, Props>(
  function ActionButton(
    {
      children,
      onClick,
      className,
      disabled,
      loading,
      completed,
      type = "button",
      variant = "primary",
      fullWidth,
    }: Props,
    ref,
  ) {
    const handleClick = useCallback(() => {
      if (loading || completed) return;
      if (onClick) onClick();
    }, [loading, completed, onClick]);

    const baseStyles =
      "inline-flex justify-center items-center px-4 py-4 text-center font-semibold text-[18px] leading-[22px] rounded-[12px] transition-all cursor-pointer duration-200 shadow-sm";
    const disabledStyles =
      "bg-background-secondary border-background-secondary text-content-dimmed-dark shadow-none pointer-events-none";
    const fullWidthStyle = fullWidth ? "w-full" : "";

    const variants: Record<ButtonVariant, string> = {
      primary:
        "bg-accent-primary text-old-mira-text border border-accent-primary shadow-[1px_1px_20px_0_#a1db0b4d] hover:shadow-[1px_1px_30px_0_#a1db0b4d] active:bg-old-mira-active-btn",
      secondary:
        "bg-accent-dimmed text-accent-primary border-none shadow-none hover:bg-old-mira-bg-hover active:bg-old-mira-bg-active",
      outlined:
        "bg-transparent text-accent-primary border border-accent-primary shadow-none hover:opacity-80",
    };

    const loadingStyles =
      variant === "primary"
        ? "cursor-default bg-accent-primary text-content-inverse"
        : "";

    return (
      <button
        ref={ref}
        type={type}
        onClick={handleClick}
        disabled={disabled}
        className={clsx(
          baseStyles,
          variants[variant],
          loading && loadingStyles,
          disabled && disabledStyles,
          fullWidthStyle,
          className,
        )}
      >
        {loading ? <Loader variant={variant} /> : children}
      </button>
    );
  },
);
