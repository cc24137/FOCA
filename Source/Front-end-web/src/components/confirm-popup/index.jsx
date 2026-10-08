import { useEffect, useId, useRef } from 'react';
import './confirm-popup.css';

/**
 * A tela controla isOpen e isLoading, executa a ação em onConfirm
 * e fecha o popup quando desejar. message recebe o texto da confirmação.
 */
export default function ConfirmPopup({
  isOpen = false,
  message,
  onConfirm,
  onCancel,
  title = 'Confirmação',
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  loadingText = 'Aguarde...',
  isLoading = false,
  errorMessage = '',
}) {
  const dialogRef = useRef(null);
  const pointerStartedOutside = useRef(false);
  const id = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || !isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    pointerStartedOutside.current = false;
    if (!dialog.open) dialog.showModal();

    return () => {
      document.body.style.overflow = previousOverflow;
      if (dialog.open) dialog.close();
    };
  }, [isOpen]);

  function handleCancel() {
    if (isOpen && !isLoading) onCancel?.();
  }

  function handleConfirm() {
    if (isOpen && !isLoading) onConfirm?.();
  }

  function isOutsideDialog(event) {
    const bounds = event.currentTarget.getBoundingClientRect();
    return event.target === event.currentTarget
      && (event.clientX < bounds.left || event.clientX > bounds.right
        || event.clientY < bounds.top || event.clientY > bounds.bottom);
  }

  function handleBackdropClick(event) {
    const shouldCancel = pointerStartedOutside.current && isOutsideDialog(event);
    pointerStartedOutside.current = false;
    if (shouldCancel) handleCancel();
  }

  return (
    <dialog
      ref={dialogRef}
      className="confirm-popup"
      aria-labelledby={`${id}-title`}
      aria-describedby={`${id}-message`}
      aria-busy={isLoading}
      onCancel={event => {
        event.preventDefault();
        handleCancel();
      }}
      onPointerDown={event => {
        pointerStartedOutside.current = isOutsideDialog(event);
      }}
      onPointerCancel={() => {
        pointerStartedOutside.current = false;
      }}
      onClick={handleBackdropClick}
    >
      <h2 id={`${id}-title`} className="confirm-popup__title">{title}</h2>
      <p id={`${id}-message`} className="confirm-popup__message">{message}</p>

      {errorMessage && (
        <p className="confirm-popup__error" role="alert">{errorMessage}</p>
      )}

      <div className="confirm-popup__actions">
        <button
          type="button"
          className="confirm-popup__button confirm-popup__button--cancel"
          onClick={handleCancel}
          disabled={isLoading}
          autoFocus
        >
          {cancelText}
        </button>
        <button
          type="button"
          className="confirm-popup__button confirm-popup__button--confirm"
          onClick={handleConfirm}
          disabled={isLoading}
        >
          {isLoading ? loadingText : confirmText}
        </button>
      </div>
    </dialog>
  );
}
