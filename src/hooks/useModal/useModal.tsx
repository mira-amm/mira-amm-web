import {ReactNode, ReactPortal, useCallback, useEffect, useState} from "react";
import {createPortal} from "react-dom";

import styles from './Modal.module.css';
import {clsx} from "clsx";
import IconButton from "@/src/components/common/IconButton/IconButton";
import CloseIcon from "@/src/components/icons/Close/CloseIcon";

type ModalProps = {
  title: string;
  children: ReactNode;
  className?: string;
}

type ReturnType = (props: ModalProps) => ReactPortal | null;

const useModal = (): [ReturnType, () => void, () => void] => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('no-scroll');
    } else {
      document.body.classList.remove('no-scroll');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }

      window.addEventListener('keydown', handleKeyDown);

      return () => {
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, []);

  const openModal = useCallback(() => setIsOpen(true), []);
  const closeModal = useCallback(() => setIsOpen(false), []);

  const Modal = ({ title, children, className }: ModalProps) => isOpen ? createPortal(
    <>
      <div className={styles.modalBackdrop} onClick={closeModal} />
      <div className={clsx(styles.modalWindow, className)}>
        <div className={styles.modalHeading}>
          <p className={styles.modalTitle}>{title}</p>
          <IconButton onClick={closeModal}>
            <CloseIcon />
          </IconButton>
        </div>
        {children}
      </div>
    </>,
    document.body,
  ) : null;

  return [Modal, openModal, closeModal];
}

export default useModal;
