"use client";

import {ReactNode, ReactPortal, useCallback, useEffect, useState} from "react";
import {createPortal} from "react-dom";
import {clsx} from "clsx";

import {IconButton} from "@/src/components/common";
import {useScrollLock} from "usehooks-ts";
import {X} from "lucide-react";
import {cn} from "../utils/cn";

type ModalProps = {
  title?: string | ReactNode;
  titleClassName?: string;
  children: ReactNode;
  className?: string;
  onClose?: VoidFunction;
  noBackground?: boolean;
  showCloseIcon?: boolean;

  backdropClassName?: string;
  modalContainerClassName?: string;
  headerClassName?: string;
  useDefaultStyling?: boolean;
};

type ModalConfig = {
  useDefaultStyling?: boolean;
  defaultBackdropClassName?: string;
  defaultModalContainerClassName?: string;
  defaultHeaderClassName?: string;
};

type ReturnType = (props: ModalProps) => ReactPortal | null;

export function useModal(
  config?: ModalConfig
): [ReturnType, () => void, () => void] {
  const [isOpen, setIsOpen] = useState(false);
  const {lock, unlock} = useScrollLock({autoLock: false});

  const defaultConfig = {
    useDefaultStyling: true,
    defaultBackdropClassName: "fixed inset-0 bg-black/35 backdrop-blur-sm z-10",
    defaultModalContainerClassName: clsx(
      "fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20",
      "flex flex-col gap-4 rounded-xl w-[90%] max-h-[80%] overflow-auto",
      "lg:max-w-[460px]"
    ),
    defaultHeaderClassName:
      "flex justify-between items-center text-[18px] leading-[22px] lg:text-xl lg:leading-[24px]",
    ...config,
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
        unlock();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [unlock]);

  const openModal = useCallback(() => {
    setIsOpen(true);
    lock();
  }, [lock]);

  const closeModal = useCallback(() => {
    setIsOpen(false);
    unlock();
  }, [unlock]);

  const Modal = ({
    title,
    titleClassName,
    children,
    className,
    onClose,
    noBackground,
    showCloseIcon = true,
    backdropClassName,
    modalContainerClassName,
    headerClassName,
    useDefaultStyling = defaultConfig.useDefaultStyling,
  }: ModalProps) => {
    if (!isOpen) return null;

    const finalBackdropClassName =
      backdropClassName || defaultConfig.defaultBackdropClassName;

    const finalModalContainerClassName =
      modalContainerClassName ||
      (useDefaultStyling
        ? clsx(
            defaultConfig.defaultModalContainerClassName,
            noBackground
              ? ""
              : "p-4 bg-white border-border-secondary border-[12px] dark:border-0 dark:bg-[#262834]",
            className
          )
        : className || "");

    const finalHeaderClassName =
      headerClassName ||
      (useDefaultStyling ? defaultConfig.defaultHeaderClassName : "");

    return createPortal(
      <>
        {/* Backdrop */}
        <div
          className={finalBackdropClassName}
          onClick={() => {
            if (onClose) onClose();
            closeModal();
          }}
        />
        {/* Modal Window */}
        <div className={finalModalContainerClassName}>
          {/* Header - only render if title exists or showCloseIcon is true */}
          {(title || showCloseIcon) && (
            <div className={finalHeaderClassName}>
              {title && (
                <div className={cn("flex-1", titleClassName)}>{title}</div>
              )}
              {showCloseIcon && (
                <IconButton
                  onClick={() => {
                    if (onClose) onClose();
                    closeModal();
                  }}
                >
                  <X />
                </IconButton>
              )}
            </div>
          )}
          {children}
        </div>
      </>,
      document.body
    );
  };

  return [Modal, openModal, closeModal];
}
