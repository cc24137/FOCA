import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import './report-template.css';
import SealIconImg from "../../assets/foca_logo.png";
import SparklesIcon from '../../assets/sparkles.svg?react';

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
            <img src={SealIconImg} alt="FOCA" className="report-icon"/>
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
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} stroke="var(--grayish-blue)" />
                <XAxis 
                  dataKey={xKey} 
                  tick={{ fontSize: 12, fill: 'var(--button-dark-blue)' }}
                  tickFormatter={(val) => new Date(val).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                />
                <YAxis tick={{ fontSize: 12, fill: 'var(--button-dark-blue)' }} />
                <Line
                  type="monotone"
                  dataKey={yKey}
                  stroke="var(--deep-blue-accent)" 
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
