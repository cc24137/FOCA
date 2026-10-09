import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import './toast.css';

const ToastContext = createContext(null);

const TOAST_TYPES = {
  success: { label: 'Sucesso', duration: 4000 },
  error: { label: 'Erro', duration: 8000 },
  info: { label: 'Informação', duration: 4000 },
  warning: { label: 'Atenção', duration: 6000 },
};

function ToastIcon({ type }) {
  const paths = {
    success: 'M22 11.1V12a10 10 0 1 1-5.93-9.14 M22 4 12 14.01l-3-3',
    error: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20 M9 9l6 6 M15 9l-6 6',
    info: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20 M12 11v6 M12 7h.01',
    warning: 'M10.3 3.9 1.8 18.5A2 2 0 0 0 3.5 21h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0 M12 9v4 M12 17h.01',
  };

  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d={paths[type]} />
    </svg>
  );
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
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          strokeLinecap="round" aria-hidden="true" focusable="false">
          <path d="m6 6 12 12 M18 6 6 18" />
        </svg>
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
