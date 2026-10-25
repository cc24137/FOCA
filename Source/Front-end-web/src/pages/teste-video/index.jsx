import { useEffect, useRef, useState } from 'react';
import Header from '../../components/header';
import AreaUploadVideo from '../../components/area-upload-video';
import GenericLineChart from '../../components/time-vs-value-chart';
import AnalysisDisclaimer from '../../components/analysis-disclaimer';
import ReportDownloadButton from '../../components/report-download-button';
import AnalysisReport from '../../components/analysis-report';
import { analysisPoints, lessonReportInformation } from '../../utils/report-data';
import { ANALYSIS_MODELS, analysisModelName } from '../../utils/analysis-models';
import { useToast } from '../../components/toast';
import { calculateFramePlan, extractFrames, MAX_FRAMES } from '../../utils/extract-frames';
import './teste-video.css';

// Preserva a exportação que já existia nesta tela.
// eslint-disable-next-line react-refresh/only-export-components
export { extractFrames } from '../../utils/extract-frames';

const formatValue = (value) => value.toLocaleString('pt-BR', { maximumFractionDigits: 2 });
const formatTime = (seconds) => {
  const total = Math.floor(seconds);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const remaining = String(total % 60).padStart(2, '0');
  return hours > 0
    ? `${hours}:${String(minutes).padStart(2, '0')}:${remaining}`
    : `${minutes}:${remaining}`;
};

function normalizeTimeline(result) {
  const timeline = result?.linha_do_tempo;
  if (!Array.isArray(timeline) || timeline.length === 0) {
    throw new Error('A análise não retornou dados de atenção para este vídeo.');
  }
  return timeline.map((point) => {
    const time = point?.segundo_video;
    const attention = point?.media_momento;
    const isNumeric = (value) =>
      (typeof value === 'number' || (typeof value === 'string' && value.trim() !== '')) &&
      Number.isFinite(Number(value));
    if (!isNumeric(time) || Number(time) < 0 || !isNumeric(attention)) {
      throw new Error('A análise retornou um ponto inválido na linha do tempo. Tente novamente.');
    }
    return { ...point, segundo_video: Number(time), media_momento: Number(attention) };
  }).sort((first, second) => first.segundo_video - second.segundo_video);
}

function responseError(result, status) {
  if (typeof result?.detail === 'string') return result.detail;
  if (typeof result?.message === 'string') return result.message;
  if (Array.isArray(result?.detail)) {
    const messages = result.detail.map((item) => item?.msg).filter((msg) => typeof msg === 'string');
    if (messages.length) return messages.join(' ');
  }
  return `Não foi possível analisar o vídeo (erro ${status}). Tente novamente.`;
}

export default function TesteVideo() {
  const { showToast } = useToast();
  const videoRef = useRef(null);
  const reportRef = useRef(null);
  const requestRef = useRef(null);
  const processIdRef = useRef(0);
  const processingRef = useRef(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [videoUrl, setVideoUrl] = useState(null);
  const [duration, setDuration] = useState(null);
  const [intervalInSeconds, setIntervalInSeconds] = useState(5);
  const [selectedModel, setSelectedModel] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [statusType, setStatusType] = useState('');
  const [visionData, setVisionData] = useState(null);

  useEffect(() => {
    setDuration(null);
    setVisionData(null);
    setStatusMessage('');
    setStatusType('');
    if (!selectedFiles.length) {
      setVideoUrl(null);
      return undefined;
    }
    const url = URL.createObjectURL(selectedFiles[0]);
    setVideoUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [selectedFiles]);

  useEffect(() => () => {
    processIdRef.current += 1;
    requestRef.current?.abort();
  }, []);

  const clearResults = () => {
    setVisionData(null);
    setStatusMessage('');
    setStatusType('');
  };

  const handleRemoveVideo = () => {
    if (processingRef.current) return;
    setSelectedFiles([]);
    setVideoUrl(null);
    setDuration(null);
    clearResults();
  };

  const handleSeekVideo = (seconds) => {
    const player = videoRef.current;
    if (!player || seconds === null || seconds === undefined) return;
    const time = Number(seconds);
    if (!Number.isFinite(time) || time < 0 || player.readyState < 1) return;
    const end = Number.isFinite(player.duration) ? player.duration : time;
    player.pause();
    player.currentTime = Math.min(time, end);
  };

  const handleChartClick = (event) => {
    const time = typeof event === 'number' ? event
      : event?.activePayload?.[0]?.payload?.segundo_video
        ?? event?.payload?.segundo_video
        ?? event?.segundo_video
        ?? event?.activeLabel;
    if (time !== '') handleSeekVideo(time);
  };

  const interval = Number(intervalInSeconds);
  const validInterval = Number.isInteger(interval) && interval >= 1;
  const framePlan = duration && validInterval ? calculateFramePlan(duration, interval) : null;
  const exceedsLimit = framePlan?.count > MAX_FRAMES;
  const timeline = visionData?.linha_do_tempo || [];
  const reportPoints = analysisPoints(timeline);
  const summary = timeline.length ? timeline.reduce((current, point) => ({
    sum: current.sum + point.media_momento,
    highest: point.media_momento > current.highest.media_momento ? point : current.highest,
    lowest: point.media_momento < current.lowest.media_momento ? point : current.lowest,
  }), { sum: 0, highest: timeline[0], lowest: timeline[0] }) : null;

  const handleProcessar = async () => {
    if (processingRef.current) return;
    if (!selectedFiles.length) {
      showToast('Selecione um vídeo primeiro.', { type: 'warning' });
      return;
    }
    if (!validInterval) {
      showToast('Informe um intervalo inteiro de pelo menos 1 segundo.', { type: 'warning' });
      return;
    }

    const processId = ++processIdRef.current;
    const controller = new AbortController();
    requestRef.current = controller;
    processingRef.current = true;
    setLoading(true);
    setVisionData(null);
    setStatusType('loading');

    try {
      setStatusMessage('1/2 Extraindo frames do vídeo...');
      const frames = await extractFrames(selectedFiles[0], interval, {
        maxWidth: 1280,
        quality: 0.8,
        maxInFlight: 2,
        onProgress: (done, total) => {
          if (processId === processIdRef.current) {
            setStatusMessage(`1/2 Extraindo frames: ${done}/${total}...`);
          }
        },
      });
      // Não envia os frames se a pessoa já saiu da tela durante a extração.
      if (processId !== processIdRef.current) return;

      setStatusMessage('2/2 Analisando os frames. Aguarde...');
      const formData = new FormData();
      formData.append('usar_modelo_melhor', String(selectedModel));
      formData.append('intervalo_segundos', String(interval));
      frames.forEach((frame, index) => formData.append('frames', frame, `frame_${index}.jpg`));

      const response = await fetch('https://foca-ai-api.onrender.com/processar-frames', {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });
      const result = await response.json().catch(() => null);
      if (processId !== processIdRef.current) return;
      if (!response.ok) throw new Error(responseError(result, response.status));

      const normalizedTimeline = normalizeTimeline(result);
      // Os resultados ficam somente no estado desta tela, sem cadastro de aula.
      setVisionData({ linha_do_tempo: normalizedTimeline });
      setStatusMessage('Análise concluída! Confira o gráfico e o resumo.');
      setStatusType('success');
      showToast('Análise concluída! Os resultados estão disponíveis nesta tela.', { type: 'success' });
    } catch (error) {
      if (processId !== processIdRef.current || error.name === 'AbortError') return;
      const message = error.message || 'Não foi possível processar o vídeo. Tente novamente.';
      const type = error.code === 'FRAME_LIMIT' ? 'warning' : 'error';
      setStatusMessage(message);
      setStatusType(type);
      showToast(message, { type });
    } finally {
      if (processId === processIdRef.current) {
        requestRef.current = null;
        processingRef.current = false;
        setLoading(false);
      }
    }
  };

  return (
    <div className="teste-video-body">
      <Header routes={[
        { textButton: 'Início', routeButton: '/' },
        { textButton: 'Sobre o Projeto', routeButton: '/sobre-projeto' },
        { textButton: 'Login', routeButton: '/login' },
      ]} />
      <main className="teste-video-content">
        <div className="teste-video-heading">
          <h1>Teste a análise de vídeo</h1>
          <p>Experimente sem criar uma conta. Os resultados ficam nesta tela e não são adicionados a um histórico.</p>
          {reportPoints.length > 0 && <ReportDownloadButton reportRef={reportRef}
            filename="relatorio-teste-video.pdf" disabled={loading} />}
        </div>

        <div className="teste-video-grid">
          <section className="teste-video-card" aria-labelledby="teste-video-config-title">
            <h2 id="teste-video-config-title">Configurações da análise</h2>
            <div className="teste-video-config-row">
              <label>
                Intervalo (s):
                <input type="number" min="1" step="1" value={intervalInSeconds} disabled={loading}
                  onChange={(event) => { setIntervalInSeconds(event.target.value); clearResults(); }} />
              </label>
              <label>
                Modelo:
                <select value={String(selectedModel)} disabled={loading}
                  onChange={(event) => { setSelectedModel(event.target.value === 'true'); clearResults(); }}>
                  {ANALYSIS_MODELS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </label>
            </div>

            {videoUrl ? (
              <div className="teste-video-player-container">
                <video ref={videoRef} src={videoUrl} controls preload="metadata" className="teste-video-player"
                  onLoadedMetadata={(event) => {
                    const videoDuration = event.currentTarget.duration;
                    setDuration(Number.isFinite(videoDuration) && videoDuration > 0 ? videoDuration : null);
                  }}
                  onError={() => {
                    setDuration(null);
                    setStatusType('error');
                    setStatusMessage('Não foi possível carregar a prévia. Verifique o formato do vídeo.');
                  }} />
              </div>
            ) : <AreaUploadVideo selectedFiles={selectedFiles} setSelectedFiles={setSelectedFiles} />}

            <p className="teste-video-help">Limite de {MAX_FRAMES.toLocaleString('pt-BR')} frames por análise. Um intervalo maior gera menos frames.</p>
            {selectedFiles.length > 1 && <p className="teste-video-help">A análise usa apenas o primeiro vídeo selecionado.</p>}
            {selectedFiles.length > 0 && !validInterval && <p className="teste-video-notice">Informe um intervalo inteiro de pelo menos 1 segundo.</p>}
            {framePlan && <p className={exceedsLimit ? 'teste-video-notice' : 'teste-video-help'}>
              Com {interval} s de intervalo, este vídeo gera {framePlan.count.toLocaleString('pt-BR')} frames.
              {exceedsLimit && ` Use pelo menos ${framePlan.minimumInterval} s para respeitar o limite.`}
            </p>}

            {selectedFiles.length > 0 && <div className="teste-video-actions">
              <button type="button" className="teste-video-primary" onClick={handleProcessar}
                disabled={loading || !validInterval || exceedsLimit}>
                {loading ? 'Processando...' : visionData ? 'Analisar novamente' : 'Iniciar análise'}
              </button>
              <button type="button" className="teste-video-secondary" disabled={loading} onClick={handleRemoveVideo}>
                Enviar outro vídeo
              </button>
            </div>}
            <div className="teste-video-status" role="status" aria-live="polite" aria-atomic="true">
              {statusMessage && <p className={`teste-video-status-${statusType}`}>{statusMessage}</p>}
            </div>
          </section>

          <section className="teste-video-results" aria-label="Resultados da análise" aria-busy={loading}>
            {summary ? <>
              <div className="teste-video-card">
                <h2 className="analysis-disclaimer-heading">
                  Atenção ao longo do vídeo
                  <AnalysisDisclaimer align="end" label="Como interpretar os resultados da análise do vídeo" />
                </h2>
                <p className="teste-video-help">Clique em um ponto do gráfico para abrir esse momento no vídeo.</p>
                <GenericLineChart data={timeline} xKey="segundo_video"
                  lines={[{ key: 'media_momento', label: 'Atenção Média', color: 'var(--indigo)' }]}
                  onClick={handleChartClick} />
              </div>
              <div className="teste-video-card">
                <h2>Resumo da análise</h2>
                <dl className="teste-video-metrics">
                  <div><dt>Média dos pontos analisados</dt><dd>{formatValue(summary.sum / timeline.length)}</dd></div>
                  <div><dt>Maior atenção</dt><dd>{formatValue(summary.highest.media_momento)}</dd></div>
                  <div><dt>Menor atenção</dt><dd>{formatValue(summary.lowest.media_momento)}</dd></div>
                  <div><dt>Momentos analisados</dt><dd>{timeline.length.toLocaleString('pt-BR')}</dd></div>
                </dl>
                <div className="teste-video-moments">
                  <button type="button" className="teste-video-secondary" onClick={() => handleSeekVideo(summary.highest.segundo_video)}>
                    Ver maior atenção — {formatTime(summary.highest.segundo_video)}
                  </button>
                  <button type="button" className="teste-video-secondary" onClick={() => handleSeekVideo(summary.lowest.segundo_video)}>
                    Ver menor atenção — {formatTime(summary.lowest.segundo_video)}
                  </button>
                </div>
              </div>
            </> : <div className="teste-video-placeholder">
              <h2>{loading ? 'Análise em andamento' : 'Aguardando análise'}</h2>
              <p>{loading ? 'Acompanhe o progresso na área do vídeo.' : 'Selecione um vídeo e inicie a análise para visualizar o gráfico de atenção e o resumo dos resultados.'}</p>
            </div>}
          </section>
        </div>
      </main>
      <AnalysisReport refProp={reportRef} pontos={reportPoints} titulo="Relatório de teste de vídeo"
        nomeInstituicao="Demonstração FOCA" observacao="Análise de teste, sem cadastro de aula. Os resultados deste relatório não foram salvos em um histórico."
        informacoes={lessonReportInformation({ origem: 'Teste de vídeo', arquivo: selectedFiles[0]?.name,
          modelo: analysisModelName(selectedModel), intervalo: intervalInSeconds })} />
    </div>
  );
}
