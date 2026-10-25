import ReportTemplate from '../report-template';
import GenericBarChart from '../bar-chart';
import GenericLineChart from '../time-vs-value-chart';
import { attentionValue, hasAnalysisResult, formatReportPercent, formatReportDate } from '../../utils/report-data';

export default function ClassReport({ refProp, turma, aulas, comparacao, linhas, professor }) {
  const analyzed = aulas.filter(hasAnalysisResult);
  if (!analyzed.length) return null;
  const lessons = aulas.map((lesson, index) => ({ ...lesson, rotulo: `Aula ${index + 1}` }));
  const bars = lessons.filter(hasAnalysisResult).map(lesson => ({ label: lesson.rotulo, media: attentionValue(lesson.media_atencao_total) }));
  const average = bars.reduce((sum, lesson) => sum + lesson.media, 0) / bars.length;
  const history = [...lessons].sort((first, second) => new Date(second.data) - new Date(first.data) || Number(second.id) - Number(first.id));

  return (
    <ReportTemplate refProp={refProp} titulo={`Relatório da turma - ${turma.nome}`} nomeInstituicao={turma.instituicao}
      dataAula={new Date().toLocaleString('pt-BR')} informacoes={[
        { label: 'Turma / Série', valor: `${turma.nome} / ${turma.serie}` },
        { label: 'Disciplina', valor: turma.disciplina },
        { label: 'Professor', valor: professor || 'Não informado' },
        { label: 'Quantidade de alunos', valor: turma.alunos },
      ]}>
      <section className="report-summary-grid">
        <div><span>Média das aulas analisadas</span><strong>{formatReportPercent(average)}</strong></div>
        <div><span>Aulas com análise</span><strong>{analyzed.length}</strong></div>
        <div><span>Aulas cadastradas</span><strong>{aulas.length}</strong></div>
      </section>
      <section className="report-box report-chart-box report-chart">
        <h2 className="box-title">Atenção média por aula (%)</h2>
        <GenericBarChart data={bars} xKey="label" yKey="media" height={235} minCategoryWidth={0} isAnimationActive={false} />
      </section>
      <section>
        <h2 className="box-title">Histórico de aulas</h2>
        <table className="report-table">
          <thead><tr><th>Aula / Data</th><th>Conteúdo</th><th>Classificação</th><th>Atenção média</th></tr></thead>
          <tbody>{history.map(lesson => (
            <tr key={lesson.id}>
              <td>{lesson.rotulo}<br />{formatReportDate(lesson.data)}</td>
              <td>{lesson.conteudo || 'Não informado'}</td>
              <td>{lesson.nome_classificacao || 'Sem classificação'}</td>
              <td>{hasAnalysisResult(lesson) ? formatReportPercent(lesson.media_atencao_total) : 'Sem resultado'}</td>
            </tr>
          ))}</tbody>
        </table>
      </section>
      {comparacao.length > 0 && <section className="report-page-break">
        <h2 className="report-main-title">Comparação das aulas selecionadas</h2>
        <section className="report-box report-chart-box report-chart">
          <GenericLineChart data={comparacao} xKey="tempoFormatado" lines={linhas} height={300} yDomain={[0, 100]}
            formatYAxis={value => `${value}%`} showDots={false} isAnimationActive={false} />
        </section>
      </section>}
      <p className="report-caption">A média considera apenas aulas com análise salva, incluindo resultados de 0%. Os indicadores são estimativas de atenção visual e devem ser interpretados no contexto pedagógico.</p>
    </ReportTemplate>
  );
}
