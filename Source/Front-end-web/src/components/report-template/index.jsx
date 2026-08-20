import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import './report-template.css';
import IconFoca from '../../assets/seal.svg?react';

function SparklesIcon(props) {
  return (
    <svg 
      width="20" 
      height="20" 
      viewBox="0 0 24 24" 
      fill="currentColor" 
      {...props}
    >
      <path d="M12 0L14.59 8.41L23 11L14.59 13.59L12 22L9.41 13.59L1 11L9.41 8.41L12 0Z" />
      <path d="M19 16L20.25 19.75L24 21L20.25 22.25L19 26L17.75 22.25L14 21L17.75 19.75L19 16Z" opacity="0.6"/>
    </svg>
  );
}

export default function ReportTemplate({
  refProp,
  data = [],
  xKey = 'timestamp',  
  yKey = 'temp',       
  nomeTurma,
  quantidadeAlunos,
  nomeProfessor,
  feedback,
  nomeDisciplina,
  dataAula,
  classificacao,
  conteudo,
  nomeInstituicao = 'Instituição'
}) {
  return (
    <div className="report-offscreen">
      <div ref={refProp} className="report-paper">
        
        {/* Cabeçalho */}
        <header className="report-header-top">
          <div className="report-logo">
            <IconFoca className="report-icon" />
            <strong>FOCA</strong>
          </div>
          <div className="report-institution">
            <h2>{nomeInstituicao}</h2>
          </div>
          <div className="report-date">
            <span>{dataAula || new Date().toLocaleDateString('pt-BR')}</span>
          </div>
        </header>

        <hr className="report-divider" />

        {/* Informações da Aula */}
        <section className="report-info-section">
          <h1 className="report-main-title">
            Relatório da aula - <span className="highlight-tag">{classificacao || 'Classificação'}</span>
          </h1>

          <div className="report-grid">
            <div className="info-item">
              <span className="info-label">Turma</span>
              <span className="info-value">{nomeTurma || 'Não informada'}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Quantidade de Alunos</span>
              <span className="info-value">{quantidadeAlunos || 'Não informada'}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Disciplina</span>
              <span className="info-value">{nomeDisciplina || 'Não informada'}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Professor</span>
              <span className="info-value">{nomeProfessor || 'Não informado'}</span>
            </div>
          </div>

          {conteudo && (
            <div className="report-description">
              <h3>Descrição da Aula</h3>
              <p>{conteudo}</p>
            </div>
          )}
        </section>

        {/* Gráfico de Atenção */}
        <section className="report-box report-chart-box">
          <h3 className="box-title">Gráfico de atenção</h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={230}>
              <LineChart data={data} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} stroke="#7a86ab" />
                <XAxis 
                  dataKey={xKey} 
                  tick={{ fontSize: 12, fill: '#566399' }}
                  tickFormatter={(val) => new Date(val).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                />
                <YAxis tick={{ fontSize: 12, fill: '#566399' }} />
                <Line
                  type="monotone"
                  dataKey={yKey}
                  stroke="#1A2968" 
                  strokeWidth={3}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Caixa de Feedback IA */}
        <section className="report-box report-feedback-box">
          <h3 className="box-title ai-title">
            <SparklesIcon className="ai-sparkle-icon" />
            Feedback da aula
          </h3>
          <div className="feedback-content">
            <p>{feedback || 'Nenhum feedback gerado para esta aula.'}</p>
          </div>
        </section>

      </div>
    </div>
  );
}