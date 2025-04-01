import {clsx} from "clsx";

import {forwardRef, memo, ReactNode, useCallback} from "react";

import Loader from "@/src/components/common/Loader/Loader";

import styles from "./ActionButton.module.css";

type ButtonType = "button" | "submit" | "reset";
type ButtonVariant = "primary" | "secondary" | "outlined";
type ButtonSize = "small" | "big" | "longer";

type Props = {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  completed?: boolean;
  type?: ButtonType;
  variant?: ButtonVariant;
  fullWidth?: boolean;
};

const ActionButton = forwardRef<HTMLButtonElement, Props>(function ActionButton(
  {
    children,
    onClick,
    className,
    disabled,
    loading,
    completed,
    type,
    variant,
    size,
    fullWidth,
  }: Props,
  ref,
) {
  const handleClick = useCallback(() => {
    if (loading || completed) {
      return;
    }

    if (onClick) {
      onClick();
    }
  }, [loading, completed, onClick]);

  return (
    <button
      className={clsx(
        styles.btn,
        variant !== "secondary" && variant !== "outlined" && styles.primary,
        variant === "secondary" && styles.secondary,
        variant === "outlined" && styles.outlined,
        size === "big" && styles.big,
        size === "longer" && styles.longer,
        loading && styles.loadingAnimation,
        loading ? "mc-type-xxl" : size === "big" ? "mc-type-l" : "mc-type-m",
        completed && styles.completed,
        fullWidth && styles.fullWidth,
        className,
      )}
      onClick={handleClick}
      disabled={disabled}
      type={type || "button"}
      ref={ref}
    >
      {!loading && children}
    </button>
  );
});

export default memo(ActionButton);
