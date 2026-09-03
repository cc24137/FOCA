import React from 'react';
import './kpi-cards.css';

export default function KpiCards({ 
  mediaGeral = 0, 
  totalAulas = 0, 
  melhorDesempenho = "N/A", 
}) {
  return (
    <div className="kpi-cards-grid">
      <div className="kpi-card">
        <span className="kpi-title">Média Geral de Atenção</span>
        <div className="kpi-value-row">
          <p className="kpi-value">{mediaGeral.toFixed(1)}%</p>
        </div>
        <span className="kpi-subtitle">Média acumulada da instituição</span>
      </div>

      <div className="kpi-card">
        <span className="kpi-title">Aulas Analisadas</span>
        <div className="kpi-value-row">
          <p className="kpi-value">{totalAulas}</p>
        </div>
        <span className="kpi-subtitle">Total de registros processados</span>
      </div>

      <div className="kpi-card positive">
        <span className="kpi-title">Destaque de Engajamento</span>
        <div className="kpi-value-row">
          <p className="kpi-value highlight">{melhorDesempenho}</p>
        </div>
        <span className="kpi-subtitle">Maior retenção média</span>
      </div>

    </div>
  );
}