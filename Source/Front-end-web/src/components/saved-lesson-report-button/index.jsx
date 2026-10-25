import { useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import AnalysisReport from '../analysis-report';
import { useToast } from '../toast';
import { getLessonReportData, LessonReportError } from '../../services/lesson-report';
import { downloadReport } from '../../utils/download-report';
import { formatReportDate, lessonReportInformation } from '../../utils/report-data';
import DownloadIcon from '../../assets/download.svg?react';
import '../report-download-button/report-download-button.css';

export default function SavedLessonReportButton({ aula, turma, professor, disabled = false }) {
  const { showToast } = useToast();
  const reportRef = useRef(null);
  const requestRef = useRef(null);
  const exportingRef = useRef(false);
  const mountedRef = useRef(true);
  const [exporting, setExporting] = useState(false);
  const [report, setReport] = useState(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; requestRef.current?.abort(); };
  }, []);

  const handleDownload = async () => {
    if (disabled || exportingRef.current) return;
    exportingRef.current = true;
    setExporting(true);
    const controller = new AbortController();
    requestRef.current = controller;
    try {
      const data = await getLessonReportData(aula.id, { signal: controller.signal });
      if (!mountedRef.current || controller.signal.aborted) return;
      const dadosAula = {
        nomeTurma: turma.nome, nomeDisciplina: turma.disciplina,
        nomeInstituicao: turma.instituicao, dataAula: aula.data, conteudo: aula.conteudo,
      };
      const informacoes = lessonReportInformation({
        idAula: aula.id, dadosAula, professor, origem: 'Histórico da aula', arquivo: aula.arquivo_video,
      });
      if (aula.nome_classificacao) informacoes.push({ label: 'Classificação', valor: aula.nome_classificacao });
      // O exportador precisa que o gráfico esteja montado antes de capturar o documento.
      flushSync(() => setReport({ ...data, informacoes, nomeInstituicao: turma.instituicao }));
      await downloadReport(reportRef.current, `relatorio-aula-${aula.id}.pdf`);
      if (mountedRef.current) showToast('Relatório PDF da aula gerado com sucesso!', { type: 'success' });
    } catch (error) {
      if (!mountedRef.current || controller.signal.aborted) return;
      const message = error instanceof LessonReportError ? error.message
        : error.response?.status === 401 ? 'Sua sessão expirou. Entre novamente para baixar o relatório.'
          : error.response?.status === 403 ? 'Você não tem permissão para acessar o relatório desta aula.'
            : error.response?.status === 404 ? 'Os dados desta aula não foram encontrados.'
              : 'Não foi possível gerar o relatório completo desta aula. Tente novamente.';
      showToast(message, { type: 'error' });
    } finally {
      controller.abort();
      if (requestRef.current === controller) requestRef.current = null;
      exportingRef.current = false;
      if (mountedRef.current) { setReport(null); setExporting(false); }
    }
  };

  return <>
    <button type="button" className="report-download-button aula-report-button" onClick={handleDownload}
      disabled={disabled || exporting} aria-busy={exporting}
      aria-label={`${exporting ? 'Gerando relatório PDF' : 'Baixar relatório PDF'} da aula de ${formatReportDate(aula.data)}`}
      title={exporting ? 'Gerando PDF...' : 'Baixar relatório PDF desta aula'}>
      <DownloadIcon width="18" height="18" aria-hidden="true" focusable="false" />
    </button>
    {report && <AnalysisReport refProp={reportRef} pontos={report.pontos} feedback={report.feedback}
      informacoes={report.informacoes} nomeInstituicao={report.nomeInstituicao}
      observacao="Relatório gerado a partir das leituras salvas e dos feedbacks retornados para esta aula." />}
  </>;
}
