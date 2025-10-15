import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

const Modal = React.memo(function Modal({ isOpen, onClose, children, containerClassName = 'max-w-md', contentClassName = '' }) {
  const overlayRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', onKeyDown);
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = original;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const overlay = (
    <div
      ref={overlayRef}
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose?.();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
      aria-modal="true"
      role="dialog"
    >
      <div
        className={`w-full ${containerClassName} transform transition-transform duration-150 ease-out will-change-transform`}
        style={{ transform: 'translateZ(0)' }}
      >
        <div className={`bg-white rounded-2xl shadow-xl border border-gray-200 ${contentClassName}`}>
          {children}
        </div>
      </div>
    </div>
  );

  return createPortal(overlay, document.body);
});

export default Modal;

