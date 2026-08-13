import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';
import './report-template.css';

export default function ReportTemplate({
  refProp,
  data = [],
  xKey = 'timestamp',  
  yKey = 'temp',       
  title,
  nomeTurma,
  nomeDisciplina,
  dataAula,
  classificacao,
  conteudo
}) {
  return (
    <div className="report-offscreen">
      <div ref={refProp} className="report-paper">
        
        <header className="report-header">
          <h1>{title || 'Relatório de Desempenho'}</h1>
          <p>Gerado em: {new Date().toLocaleDateString('pt-BR')}</p>
        </header>

        <section className="report-section">
          <h2>Resumo da Aula</h2>
          <p><strong>Turma:</strong> {nomeTurma || 'Não informada'}</p>
          <p><strong>Disciplina:</strong> {nomeDisciplina || 'Não informada'}</p>
          <p><strong>Data:</strong> {dataAula}</p>
          {classificacao && <p><strong>Classificação:</strong> {classificacao}</p>}
          {conteudo && <p><strong>Conteúdo:</strong> {conteudo}</p>}
        </section>

        <section className="report-chart-section">
          <h2>Análise Temporal</h2>
          <LineChart width={700} height={300} data={data}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            
            <XAxis 
              dataKey={xKey} 
              tickFormatter={(val) => new Date(val).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            />
            <YAxis />
            
            <Line
              type="monotone"
              dataKey={yKey}
              stroke="#4F46E5"
              strokeWidth={3}
              isAnimationActive={false}
            />
          </LineChart>
        </section>

        <footer className="report-footer">
          <p>Página 1 de 1 - Documento gerado automaticamente.</p>
        </footer>

      </div>
    </div>
  );
}