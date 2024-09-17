import {clsx} from 'clsx';
import {memo, ReactNode, RefObject, useCallback} from 'react';
import Loader from "@/src/components/common/Loader/Loader";

import styles from './ActionButton.module.css';

type ButtonType = 'button' | 'submit' | 'reset';
type ButtonVariant = 'primary' | 'secondary' | 'outlined';

type Props = {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
  loading?: boolean;
  completed?: boolean;
  buttonRef?: RefObject<HTMLButtonElement>;
  type?: ButtonType;
  variant?: ButtonVariant;
  fullWidth?: boolean;
};

const ActionButton = ({
  children,
  onClick,
  className,
  disabled,
  loading,
  completed,
  buttonRef,
  type,
  variant,
  fullWidth,
}: Props) => {
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
        variant === 'secondary' && styles.secondary,
        variant === 'outlined' && styles.outlined,
        loading && styles.loading,
        completed && styles.completed,
        fullWidth && styles.fullWidth,
        className
      )}
      onClick={handleClick}
      disabled={disabled}
      ref={buttonRef}
      type={type || 'button'}
    >
      {loading ? <Loader/> : children}
    </button>
  );
};

export default memo(ActionButton);
