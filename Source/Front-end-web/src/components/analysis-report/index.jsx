import ReportTemplate from '../report-template';
import GenericLineChart from '../time-vs-value-chart';
import { analysisPoints, formatReportPercent, formatReportTime } from '../../utils/report-data';

function FeedbackSection({ section, title }) {
  if (!section) return null;
  const items = Array.isArray(section.items) ? section.items : [];
  const recommendations = Array.isArray(section.recommendations) ? section.recommendations : [];
  return (
    <section className="report-feedback-section">
      <h2 className="box-title">{title}</h2>
      {section.summary?.description && <p className="report-caption">{section.summary.description}</p>}
      {items.map((item, index) => (
        <article className="report-feedback-item" key={item.id ?? index}>
          <h3>{item.title}</h3><p>{item.message}</p>
          {item.interval && <p className="report-caption">
            Trecho: {formatReportTime(item.interval.startSecond)} a {formatReportTime(item.interval.endSecond)}
          </p>}
        </article>
      ))}
      {recommendations.length > 0 && <h3 className="report-section-subtitle">Recomendações</h3>}
      {recommendations.map((recommendation, index) => (
        <article className="report-feedback-item" key={recommendation.id ?? index}>
          <h3>{recommendation.title}</h3><p>{recommendation.message}</p>
          {recommendation.actions?.length > 0 && <ul>
            {recommendation.actions.map((action, actionIndex) => <li key={actionIndex}>{action}</li>)}
          </ul>}
        </article>
      ))}
      {!items.length && !recommendations.length && <p className="report-caption">Nenhum feedback disponível nesta seção.</p>}
    </section>
  );
}

export default function AnalysisReport({
  refProp, pontos, titulo = 'Relatório de análise da aula', informacoes, nomeInstituicao = 'Análise FOCA', feedback, observacao,
}) {
  const valid = analysisPoints(pontos);
  if (!valid.length) return null;
  const average = valid.reduce((sum, point) => sum + point.media_momento, 0) / valid.length;
  const highest = valid.reduce((best, point) => point.media_momento > best.media_momento ? point : best);
  const lowest = valid.reduce((best, point) => point.media_momento < best.media_momento ? point : best);
  const hasFeedback = Boolean(feedback?.lesson || feedback?.history);

  return (
    <ReportTemplate refProp={refProp} titulo={titulo} informacoes={informacoes}
      nomeInstituicao={nomeInstituicao} dataAula={new Date().toLocaleString('pt-BR')}>
      {observacao && <p className="report-notice">{observacao}</p>}
      <section className="report-summary-grid">
        <div><span>Atenção média</span><strong>{formatReportPercent(average)}</strong><p>{valid.length} leituras válidas</p></div>
        <div><span>Maior atenção</span><strong>{formatReportPercent(highest.media_momento)}</strong><p>Instante {formatReportTime(highest.segundo_video)}</p></div>
        <div><span>Menor atenção</span><strong>{formatReportPercent(lowest.media_momento)}</strong><p>Instante {formatReportTime(lowest.segundo_video)}</p></div>
      </section>
      <section className="report-box report-chart-box report-chart">
        <h2 className="box-title">Atenção ao longo da análise (%)</h2>
        <GenericLineChart data={valid} xKey="segundo_video" height={informacoes?.length > 6 ? 200 : 270} showDots={false} yDomain={[0, 100]}
          lines={[{ key: 'media_momento', label: 'Atenção média', color: 'var(--indigo)' }]}
          formatYAxis={value => `${value}%`} isAnimationActive={false} />
      </section>
      {hasFeedback && <div className="report-page-break">
        <FeedbackSection section={feedback.lesson} title="Feedbacks da aula" />
        <FeedbackSection section={feedback.history} title="Comparativo do histórico" />
      </div>}
      {!hasFeedback && informacoes?.length > 6 ? <p className="report-caption report-interpretation">
        Os percentuais são estimativas de atenção visual. Considere o contexto da aula e as condições de captura; esses indicadores não medem diretamente a aprendizagem.
      </p> : <section className="report-box report-feedback-box report-interpretation">
        <h2 className="box-title">Como interpretar os resultados</h2>
        <p className="report-caption">Os percentuais são estimativas de atenção visual. Considere o contexto da aula e as condições de captura; esses indicadores não medem diretamente a aprendizagem.</p>
      </section>}
    </ReportTemplate>
  );
}
