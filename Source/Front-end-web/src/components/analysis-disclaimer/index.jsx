import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import InfoIcon from '../../assets/info.svg?react';
import './analysis-disclaimer.css';

/** Aviso reutilizável para títulos de gráficos e indicadores. */
export default function AnalysisDisclaimer({
  title = 'Sobre estes resultados',
  label = 'Informações sobre a interpretação dos resultados',
  placement = 'bottom',
  align = 'start',
  className = '',
  children,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const id = useId();
  const triggerRef = useRef(null);
  const panelRef = useRef(null);
  const closeTimerRef = useRef(null);
  const pinnedRef = useRef(false);

  const cancelClose = useCallback(() => {
    window.clearTimeout(closeTimerRef.current);
  }, []);

  const close = useCallback(() => {
    cancelClose();
    pinnedRef.current = false;
    setIsOpen(false);
  }, [cancelClose]);

  const openOnHover = (event) => {
    if (event.pointerType === 'touch') return;
    cancelClose();
    setIsOpen(true);
  };

  const closeAfterHover = () => {
    cancelClose();
    // A pequena pausa permite mover o ponteiro do ícone até o aviso.
    closeTimerRef.current = window.setTimeout(() => {
      if (!pinnedRef.current && !triggerRef.current?.matches(':focus-visible')) {
        close();
      }
    }, 160);
  };

  useEffect(() => cancelClose, [cancelClose]);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event) => {
      if (!triggerRef.current?.contains(event.target) && !panelRef.current?.contains(event.target)) {
        close();
      }
    };
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') close();
    };
    const handleFocusIn = (event) => {
      if (!triggerRef.current?.contains(event.target) && !panelRef.current?.contains(event.target)) {
        close();
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('focusin', handleFocusIn);
    window.addEventListener('blur', close);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('focusin', handleFocusIn);
      window.removeEventListener('blur', close);
    };
  }, [isOpen, close]);

  useLayoutEffect(() => {
    if (!isOpen) return;

    const updatePosition = () => {
      const trigger = triggerRef.current;
      const panel = panelRef.current;
      if (!trigger || !panel) return;

      const rect = trigger.getBoundingClientRect();
      const margin = 12;
      const gap = 10;
      const viewportWidth = document.documentElement.clientWidth;
      const spaceAbove = Math.max(0, rect.top - margin - gap);
      const spaceBelow = Math.max(0, window.innerHeight - rect.bottom - margin - gap);
      // Mede a altura natural antes de escolher o lado e limitar a área rolável.
      panel.style.maxWidth = `${viewportWidth - margin * 2}px`;
      panel.style.maxHeight = `${window.innerHeight - margin * 2}px`;
      const preferredSpace = placement === 'top' ? spaceAbove : spaceBelow;
      const oppositeSpace = placement === 'top' ? spaceBelow : spaceAbove;
      const side = panel.offsetHeight > preferredSpace && oppositeSpace > preferredSpace
        ? (placement === 'top' ? 'bottom' : 'top')
        : placement;

      panel.style.maxHeight = `${side === 'top' ? spaceAbove : spaceBelow}px`;
      const width = panel.offsetWidth;
      const preferredLeft = align === 'end' ? rect.right - width : rect.left;
      const left = Math.max(margin, Math.min(preferredLeft, viewportWidth - width - margin));
      const top = side === 'top' ? rect.top - panel.offsetHeight - gap : rect.bottom + gap;

      panel.style.left = `${left}px`;
      panel.style.top = `${Math.max(margin, top)}px`;
      panel.style.setProperty('--disclaimer-arrow-left', `${Math.max(18, Math.min(rect.left + rect.width / 2 - left, width - 18))}px`);
      panel.dataset.side = side;
    };

    updatePosition();
    const observer = new ResizeObserver(updatePosition);
    observer.observe(panelRef.current);
    observer.observe(triggerRef.current);
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isOpen, placement, align]);

  return (
    <span className={`analysis-disclaimer ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        className={`analysis-disclaimer__trigger${isOpen ? ' analysis-disclaimer__trigger--open' : ''}`}
        aria-label={label}
        aria-expanded={isOpen}
        aria-controls={isOpen ? id : undefined}
        aria-describedby={isOpen ? id : undefined}
        onPointerEnter={openOnHover}
        onPointerLeave={closeAfterHover}
        onFocus={(event) => {
          if (event.currentTarget.matches(':focus-visible')) {
            cancelClose();
            setIsOpen(true);
          }
        }}
        onClick={() => {
          if (pinnedRef.current) {
            close();
          } else {
            cancelClose();
            pinnedRef.current = true;
            setIsOpen(true);
          }
        }}
      >
        <InfoIcon className="analysis-disclaimer__icon" aria-hidden="true" focusable="false" />
      </button>

      {isOpen && createPortal(
        <div
          ref={panelRef}
          id={id}
          role="tooltip"
          className="analysis-disclaimer__panel"
          onPointerEnter={openOnHover}
          onPointerLeave={closeAfterHover}
        >
          <div className="analysis-disclaimer__content">
            <p className="analysis-disclaimer__title">{title}</p>
            <div className="analysis-disclaimer__description">
              {children ?? (
                <>
                  <p>
                    Os gráficos e índices são <strong>estimativas</strong> e podem conter
                    imprecisões. Eles não representam medidas absolutas de atenção ou aprendizagem.
                  </p>
                  <p>
                    Use estes resultados como um guia para a reflexão pedagógica, considerando
                    o contexto de cada aula. <strong>Não os utilize como métricas absolutas
                    para avaliar ou comparar docentes.</strong>
                  </p>
                </>
              )}
            </div>
          </div>
        </div>,
        document.body,
      )}
    </span>
  );
}
