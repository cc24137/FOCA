import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import './toast.css';
import ToastSuccessIcon from '../../assets/toast-success.svg?react';
import ToastErrorIcon from '../../assets/toast-error.svg?react';
import ToastInfoIcon from '../../assets/toast-info.svg?react';
import ToastWarningIcon from '../../assets/toast-warning.svg?react';
import ToastCloseIcon from '../../assets/toast-close.svg?react';

const ToastContext = createContext(null);

const TOAST_TYPES = {
  success: { label: 'Sucesso', duration: 4000 },
  error: { label: 'Erro', duration: 8000 },
  info: { label: 'Informação', duration: 4000 },
  warning: { label: 'Atenção', duration: 6000 },
};

function ToastIcon({ type }) {
  const icons = {
    success: ToastSuccessIcon,
    error: ToastErrorIcon,
    info: ToastInfoIcon,
    warning: ToastWarningIcon,
  };
  const Icon = icons[type];

  return <Icon aria-hidden="true" focusable="false" />;
}

function ToastCard({ toast, onClose }) {
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const remainingTime = useRef(toast.duration);
  const paused = hovered || focused;

  useEffect(() => {
    // Duração zero mantém o card visível até o fechamento manual.
    if (paused || toast.duration === 0) return;

    const startedAt = Date.now();
    const timeoutId = window.setTimeout(() => onClose(toast.id), remainingTime.current);

    return () => {
      window.clearTimeout(timeoutId);
      remainingTime.current = Math.max(0, remainingTime.current - (Date.now() - startedAt));
    };
  }, [toast.id, toast.duration, paused, onClose]);

  return (
    <li
      className={`foca-toast foca-toast--${toast.type}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={event => {
        if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false);
      }}
    >
      <span className="foca-toast__icon"><ToastIcon type={toast.type} /></span>
      <div className="foca-toast__content" role={toast.type === 'error' ? 'alert' : 'status'} aria-atomic="true">
        <p className="foca-toast__title">{TOAST_TYPES[toast.type].label}</p>
        <p className="foca-toast__message">{toast.message}</p>
      </div>
      <button type="button" className="foca-toast__close" aria-label="Fechar notificação"
        onClick={() => onClose(toast.id)}>
        <ToastCloseIcon aria-hidden="true" focusable="false" />
      </button>
    </li>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const nextId = useRef(0);

  const dismissToast = useCallback(id => {
    setToasts(current => current.filter(toast => toast.id !== id));
  }, []);

  /**
   * showToast('Mensagem', { type: 'success', duration: 4000 })
   * Tipos: success, error, info e warning. Duração em ms; 0 fecha apenas manualmente.
   * Retorna o ID do card para permitir dismissToast(id).
   */
  const showToast = useCallback((message, { type = 'info', duration } = {}) => {
    if (typeof message !== 'string' || !message.trim()) return null;

    const toastType = Object.hasOwn(TOAST_TYPES, type) ? type : 'info';
    const toastDuration = Number.isFinite(duration) && duration >= 0
      ? duration
      : TOAST_TYPES[toastType].duration;
    const id = `foca-toast-${++nextId.current}`;

    setToasts(current => [...current, { id, message, type: toastType, duration: toastDuration }]);
    return id;
  }, []);

  const value = useMemo(() => ({ showToast, dismissToast }), [showToast, dismissToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {typeof document !== 'undefined' && createPortal(
        <section className="foca-toast-region" aria-label="Notificações">
          <ol className="foca-toast-list">
            {toasts.slice().reverse().map(toast => (
              <ToastCard key={toast.id} toast={toast} onClose={dismissToast} />
            ))}
          </ol>
        </section>,
        document.body
      )}
    </ToastContext.Provider>
  );
}


export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast deve ser usado dentro de ToastProvider.');
  return context;
}
