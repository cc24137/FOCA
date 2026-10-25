import ReportTemplate from '../report-template';
import GenericBarChart from '../bar-chart';
import GenericLineChart from '../time-vs-value-chart';
import './statistics-report.css';

const formatPercent = value => `${Number(value).toLocaleString('pt-BR', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
})}%`;

export default function StatisticsReport({
  refProp,
  contexto,
  medias,
  linhaDoTempo,
  linhas,
  nomeInstituicao,
}) {
  if (!contexto || medias.length === 0) return null;

  const melhorItem = medias.find(item => item.label === contexto.melhorDesempenho);
  const cores = linhas.map(linha => linha.color);
  const itens = medias.map((item, index) => ({ ...item, label: `Item ${index + 1}` }));
  const series = linhas.map((linha, index) => ({ ...linha, label: `Item ${index + 1}` }));

  return (
    <ReportTemplate
      refProp={refProp}
      className="statistics-report"
      nomeInstituicao={nomeInstituicao}
      dataAula={contexto.geradoEm}
      titulo={<>Relatório de estatísticas - <span className="highlight-tag">{contexto.tipo}</span></>}
      informacoes={contexto.filtros}
    >
      <section className="statistics-report__metrics">
        <div className="statistics-report__metric">
          <span>Atenção média dos itens</span>
          <strong>{formatPercent(contexto.mediaGeral)}</strong>
        </div>
        <div className="statistics-report__metric">
          <span>Aulas com análise salva</span>
          <strong>{contexto.totalAulas}</strong>
        </div>
        <div className="statistics-report__metric">
          <span>Maior média</span>
          <strong>{melhorItem ? formatPercent(melhorItem.media) : 'Não disponível'}</strong>
          <p>{contexto.melhorDesempenho}</p>
        </div>
      </section>

      {contexto.leiturasIncompletas && (
        <p className="statistics-report__warning">
          Algumas leituras não puderam ser carregadas. Os gráficos refletem apenas os dados disponíveis.
        </p>
      )}

      <section className="report-box report-chart-box statistics-report__chart">
        <h2 className="box-title">Comparativo de média de atenção</h2>
        <GenericBarChart
          data={itens}
          xKey="label"
          yKey="media"
          colors={cores}
          height={235}
          minCategoryWidth={0}
          isAnimationActive={false}
        />
      </section>

      <section className="statistics-report__results">
        <h2 className="box-title">Itens comparados</h2>
        <table className="statistics-report__table">
          <thead>
            <tr><th>Item</th><th>{contexto.tipo}</th><th>Atenção média</th></tr>
          </thead>
          <tbody>
            {medias.map((item, index) => (
              <tr key={item.label}>
                <td>
                  <span className="statistics-report__swatch" style={{ backgroundColor: cores[index] }} />
                  {index + 1}
                </td>
                <td>{item.label}</td>
                <td>{formatPercent(item.media)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="statistics-report__timeline">
        <h2 className="report-main-title">Evolução da atenção ao longo do tempo</h2>
        <p className="statistics-report__caption">
          Comparação por {contexto.tipo.toLocaleLowerCase('pt-BR')}. A numeração dos itens corresponde à tabela anterior.
        </p>
        <section className="report-box report-chart-box statistics-report__chart">
          <h3 className="box-title">Atenção média por instante (%)</h3>
          <GenericLineChart
            data={linhaDoTempo}
            xKey="tempoFormatado"
            lines={series}
            height={300}
            formatYAxis={value => `${value}%`}
            showDots={false}
            isAnimationActive={false}
          />
        </section>
        <div className="report-box report-feedback-box statistics-report__interpretation">
          <h3 className="box-title">Como interpretar os resultados</h3>
          <p>
            As séries representam o tempo decorrido das aulas. Cada ponto reúne as leituras válidas
            disponíveis naquele instante, e a média de cada item considera esses pontos.
          </p>
          <p>
            Os percentuais são estimativas de atenção visual. Considere o contexto da aula e as
            condições de captura; esses indicadores não medem diretamente a aprendizagem.
          </p>
        </div>
      </section>
    </ReportTemplate>
  );
}
