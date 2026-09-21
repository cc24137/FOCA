import React, { useState } from 'react';
import './feedback-cards.css';

const TONE_CONFIG = {
  positive: {
    label: 'Destaque',
    className: 'tone-positive'
  },
  warning: {
    label: 'Atenção',
    className: 'tone-warning'
  },
  info: {
    label: 'Informação',
    className: 'tone-info'
  },
  neutral: {
    label: 'Observação',
    className: 'tone-neutral'
  }
};

const formatSeconds = (seconds) => {
  if (seconds === undefined || seconds === null) return '';
  const min = Math.floor(seconds / 60);
  const sec = Math.floor(seconds % 60);
  return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
};

export default function FeedbackCards({ section, sectionTitle, onSelectInterval }) {
  const [activeModalItem, setActiveModalItem] = useState(null);

  if (!section) return null;

  const { summary, items = [], recommendations = [] } = section;

  const handleOpenModal = (item) => {
    const relatedRecs = recommendations.filter((rec) =>
      rec.relatedFeedbackIds?.includes(item.id)
    );
    setActiveModalItem({ item, recommendations: relatedRecs });
  };

  const handleCloseModal = () => {
    setActiveModalItem(null);
  };

  return (
    <div className="feedback-cards-container">
      <div className="feedback-section-header">
        <h3 className="feedback-section-title">{sectionTitle || summary?.title}</h3>
        {summary?.description && (
          <p className="feedback-section-description">{summary.description}</p>
        )}
      </div>

      {items.length === 0 ? (
        <div className="feedback-empty-state">
          <p>Nenhum registro encontrado para esta seção.</p>
        </div>
      ) : (
        <div className="feedback-grid">
          {items.map((item) => {
            const toneStyle = TONE_CONFIG[item.tone] || TONE_CONFIG.neutral;
            const relatedCount = recommendations.filter((rec) =>
              rec.relatedFeedbackIds?.includes(item.id)
            ).length;

            return (
              <div
                key={item.id}
                className={`feedback-card ${toneStyle.className}`}
                onClick={() => handleOpenModal(item)}
              >
                <div className="card-top-row">
                  <span className="tone-badge">
                    {toneStyle.label}
                  </span>
                </div>

                <h4 className="card-item-title">{item.title}</h4>
                <p className="card-item-message">{item.message}</p>

                <div className="card-footer-row">
                  {item.interval ? (
                    <span className="interval-badge">
                      {formatSeconds(item.interval.startSecond)} - {formatSeconds(item.interval.endSecond)}
                    </span>
                  ) : <span />}

                  {relatedCount > 0 && (
                    <span className="recs-count-badge">
                      {relatedCount} {relatedCount === 1 ? 'sugestão' : 'sugestões'}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeModalItem && (
        <div className="feedback-modal-overlay" onClick={handleCloseModal}>
          <div
            className="feedback-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <button className="modal-close-btn" onClick={handleCloseModal}>
              &times;
            </button>

            <div className="modal-header">
              <span className={`tone-badge ${TONE_CONFIG[activeModalItem.item.tone]?.className}`}>
                {TONE_CONFIG[activeModalItem.item.tone]?.label}
              </span>
              <h2>{activeModalItem.item.title}</h2>
            </div>

            <div className="modal-body">
              <div className="modal-section">
                <h4>Detalhamento</h4>
                <p className="modal-main-message">{activeModalItem.item.message}</p>

                {activeModalItem.item.interval && (
                  <div className="modal-info-pill">
                    <span>
                      <strong>Trecho da Aula:</strong> {formatSeconds(activeModalItem.item.interval.startSecond)} até {formatSeconds(activeModalItem.item.interval.endSecond)}
                    </span>
                    {onSelectInterval && (
                      <button
                        className="btn-jump-video"
                        onClick={() => {
                          onSelectInterval(activeModalItem.item.interval.startSecond);
                          handleCloseModal();
                        }}
                      >
                        Ir para o trecho
                      </button>
                    )}
                  </div>
                )}
              </div>

              {activeModalItem.recommendations.length > 0 && (
                <div className="modal-section modal-recs-section">
                  <h4>Sugestões e Recomendações</h4>
                  {activeModalItem.recommendations.map((rec) => (
                    <div key={rec.id} className="modal-rec-card">
                      <h5 className="rec-title">{rec.title}</h5>
                      <p className="rec-message">{rec.message}</p>
                      {rec.actions && rec.actions.length > 0 && (
                        <div className="rec-actions-container">
                          <strong>Ações sugeridas:</strong>
                          <ul>
                            {rec.actions.map((action, idx) => (
                              <li key={idx}>{action}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}