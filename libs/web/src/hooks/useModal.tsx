"use client"

import { ReactNode, ReactPortal, useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { clsx } from "clsx";

import { IconButton } from "@/src/components/common";
import { useScrollLock } from "usehooks-ts";
import { X } from "lucide-react";

type ReturnType = (props: {
  title: string | ReactNode;
  titleClassName?: string;
  children: ReactNode;
  className?: string;
  onClose?: VoidFunction;
}) => ReactPortal | null;


export function useModal(): [ReturnType, () => void, () => void]{
  const [isOpen, setIsOpen] = useState(false);
  const { lock, unlock } = useScrollLock({ autoLock: false });

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
  }: {
  title: string | ReactNode;
  titleClassName?: string;
  children: ReactNode;
  className?: string;
  onClose?: VoidFunction;
  }) =>
    isOpen
      ? createPortal(
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/35 backdrop-blur-sm z-10"
              onClick={() => {
                if (onClose) onClose();
                closeModal();
              }}
            />
            {/* Modal Window */}
            <div
              className={clsx(
                "fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20",
                "flex flex-col gap-4 p-4 bg-[#262834] rounded-[12px] w-[90%] max-h-[80%] overflow-auto",
                "lg:max-w-[460px]",
                className
              )}
            >
              {/* Header */}
              <div className="flex justify-between items-center font-medium text-[18px] leading-[22px] lg:text-[20px] lg:leading-[24px]">
                <div className={clsx("flex-1", titleClassName)}>{title}</div>
                <IconButton
                  onClick={() => {
                    if (onClose) onClose();
                    closeModal();
                  }}
                >
                  <X />
                </IconButton>
              </div>
              {children}
            </div>
          </>,
          document.body
        )
      : null;

  return [Modal, openModal, closeModal];
}
