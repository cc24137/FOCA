import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Header from '../../components/header';
import GenericLineChart from '../../components/time-vs-value-chart';
import FeedbackCards from '../../components/feedback-cards';
import api from '../../services/api';
import './analise-tempo-real.css';
import { useToast } from '../../components/toast';

const VISION_URL = 'http://127.0.0.1:8000/processar-frame-tempo-real/';
const formatTime = (seconds) => `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${Math.floor(seconds % 60).toString().padStart(2, '0')}`;
const formatValue = (value) => value == null ? '—' : value.toLocaleString('pt-BR', { maximumFractionDigits: 2 });
const cameraError = (error) => ({
  NotAllowedError: 'Permissão de câmera negada. Libere o acesso nas configurações do navegador.',
  NotFoundError: 'Nenhuma câmera disponível.',
  NotReadableError: 'Não foi possível abrir a câmera. Verifique se outro aplicativo está usando-a.',
  OverconstrainedError: 'A câmera selecionada não está mais disponível. Atualize a lista.',
}[error.name] || error.message || 'Não foi possível acessar a câmera.');

export default function AnaliseTempoReal() {
  const { showToast } = useToast();
  const { state } = useLocation();
  const navigate = useNavigate();
  const idAula = state?.idAula;
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const timerRef = useRef(null);
  const requestRef = useRef(null);
  const mountedRef = useRef(true);
  const modeRef = useRef('idle');
  const generationRef = useRef(0);
  const elapsedRef = useRef(0);
  const startedAtRef = useRef(null);
  const pointsRef = useRef([]);
  const failuresRef = useRef(0);
  const avisoSemAula = useRef(false);
  const [mode, setMode] = useState('idle');
  const [busy, setBusy] = useState(false);
  const [devices, setDevices] = useState([]);
  const [deviceId, setDeviceId] = useState('');
  const [preview, setPreview] = useState(false);
  const [interval, setInterval] = useState(5);
  const [model, setModel] = useState(false);
  const [points, setPoints] = useState([]);
  const [elapsed, setElapsed] = useState(0);
  const [message, setMessage] = useState('Selecione uma câmera para visualizar a sala.');
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [saved, setSaved] = useState(false);
  const [processing, setProcessing] = useState(false);

  const changeMode = (value) => { modeRef.current = value; setMode(value); };
  const activeSeconds = () => (elapsedRef.current + (startedAtRef.current == null ? 0 : performance.now() - startedAtRef.current)) / 1000;
  const stopClock = () => {
    if (startedAtRef.current != null) elapsedRef.current += performance.now() - startedAtRef.current;
    startedAtRef.current = null;
    setElapsed(activeSeconds());
  };
  const releaseCamera = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setPreview(false);
  };
  const cancelAnalysis = () => {
    generationRef.current += 1;
    clearTimeout(timerRef.current);
    requestRef.current?.abort();
    requestRef.current = null;
    setProcessing(false);
  };

  useEffect(() => {
    if (idAula) {
      avisoSemAula.current = false;
    } else if (!avisoSemAula.current) {
      avisoSemAula.current = true;
      showToast('Aula não informada. Cadastre uma aula para iniciar a análise.', { type: 'warning' });
      navigate('/cadastro-aula', { replace: true });
    }
  }, [idAula, navigate, showToast]);
  useEffect(() => {
    mountedRef.current = true;
    // Enumerar não liga a câmera nem pede permissão ao abrir a página.
    const refresh = async () => {
      try {
        const all = await navigator.mediaDevices?.enumerateDevices();
        if (!mountedRef.current) return;
        const cameras = (all || []).filter((device) => device.kind === 'videoinput');
        setDevices(cameras);
        setDeviceId((current) => cameras.some((device) => device.deviceId === current) ? current : cameras[0]?.deviceId || '');
      } catch { /* A permissão será solicitada ao visualizar. */ }
    };
    refresh();
    navigator.mediaDevices?.addEventListener('devicechange', refresh);
    return () => {
      mountedRef.current = false;
      generationRef.current += 1;
      clearTimeout(timerRef.current);
      requestRef.current?.abort();
      streamRef.current?.getTracks().forEach((track) => track.stop());
      navigator.mediaDevices?.removeEventListener('devicechange', refresh);
    };
  }, []);
  useEffect(() => {
    if (mode !== 'running') return;
    const timer = window.setInterval(() => setElapsed(activeSeconds()), 500);
    const warn = (event) => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => { clearInterval(timer); window.removeEventListener('beforeunload', warn); };
  }, [mode]);

  const openCamera = async () => {
    if (!navigator.mediaDevices?.getUserMedia) throw new Error('A câmera precisa de HTTPS ou localhost e de um navegador compatível.');
    releaseCamera();
    const generation = generationRef.current;
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { ...(deviceId ? { deviceId: { exact: deviceId } } : {}), width: { ideal: 1280 }, height: { ideal: 720 } },
      audio: false,
    });
    if (!mountedRef.current || generation !== generationRef.current) {
      stream.getTracks().forEach((track) => track.stop());
      return false;
    }
    streamRef.current = stream;
    videoRef.current.srcObject = stream;
    await videoRef.current.play();
    setPreview(true);
    const cameras = (await navigator.mediaDevices.enumerateDevices()).filter((device) => device.kind === 'videoinput');
    if (!mountedRef.current || generation !== generationRef.current) return false;
    setDevices(cameras);
    setDeviceId(stream.getVideoTracks()[0].getSettings().deviceId || deviceId);
    stream.getVideoTracks()[0].addEventListener('ended', () => {
      if (streamRef.current !== stream || !mountedRef.current) return;
      cancelAnalysis();
      if (modeRef.current === 'running') { stopClock(); changeMode('paused'); }
      releaseCamera();
      setError('A câmera foi desconectada. Reconecte-a e retome a análise.');
      showToast('A câmera foi desconectada. Reconecte-a e retome a análise.', { type: 'error' });
    }, { once: true });
    return true;
  };

  const previewCamera = async () => {
    setBusy(true); setError('');
    try { if (await openCamera()) setMessage('Câmera pronta. Inicie a análise quando desejar.'); }
    catch (err) {
      releaseCamera();
      if (mountedRef.current) {
        const mensagem = cameraError(err);
        setError(mensagem);
        showToast(mensagem, { type: 'error' });
      }
    }
    finally { if (mountedRef.current) setBusy(false); }
  };

  // Não há galeria, MediaRecorder, localStorage nem persistência de imagens.
  const sample = async (generation) => {
    if (generation !== generationRef.current || modeRef.current !== 'running') return;
    const video = videoRef.current;
    if (!video || video.readyState < 2 || !video.videoWidth) {
      timerRef.current = setTimeout(() => sample(generation), 250);
      return;
    }
    const capturedAt = Math.floor(activeSeconds());
    const cycleStart = performance.now();
    const controller = new AbortController();
    requestRef.current = controller;
    const timeout = setTimeout(() => controller.abort(), 30000);
    setProcessing(true);
    let canvas = null;
    let blob = null;
    try {
      canvas = document.createElement('canvas');
      canvas.width = video.videoWidth; canvas.height = video.videoHeight;
      canvas.getContext('2d').drawImage(video, 0, 0);
      blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.8));
      canvas.width = 0; canvas.height = 0; canvas = null;
      if (!blob) throw new Error('Não foi possível capturar a imagem.');
      if (generation !== generationRef.current) return;
      const url = new URL(VISION_URL, window.location.origin);
      url.searchParams.set('usar_modelo_melhor', model);
      const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'image/jpeg' }, body: blob, signal: controller.signal, cache: 'no-store' });
      if (!response.ok) {
        const detail = await response.json().catch(() => null);
        throw new Error(typeof detail?.detail === 'string' ? detail.detail : `Erro na análise (HTTP ${response.status}).`);
      }
      const result = await response.json();
      if (generation !== generationRef.current || !mountedRef.current) return;
      // Confirma o motor selecionado antes de incorporar a leitura.
      if (!Array.isArray(result.linha_do_tempo)) throw new Error('Resposta inválida: linha_do_tempo ausente.');
      const point = result.linha_do_tempo[0];
      if (point && (typeof point.media_momento !== 'number' || !Number.isFinite(point.media_momento))) throw new Error('Resposta inválida: atenção não numérica.');
      pointsRef.current = [...pointsRef.current, {
        segundo_video: capturedAt,
        media_momento: point?.media_momento ?? null,
        total_focados: point?.total_focados ?? 0,
        total_distraidos: point?.total_distraidos ?? 0,
      }];
      setPoints(pointsRef.current);
      failuresRef.current = 0;
      setError('');
      setMessage(point ? `Última leitura em ${formatTime(capturedAt)}.` : 'Nenhum aluno detectado na última captura. Essa leitura não entra na média.');
    } catch (err) {
      if (generation !== generationRef.current || !mountedRef.current) return;
      failuresRef.current += 1;
      setError(err.name === 'AbortError' ? 'O processamento excedeu 30 segundos.' : err.message);
      if (model === true || failuresRef.current >= 3) {
        cancelAnalysis(); stopClock(); releaseCamera(); changeMode('paused');
        setMessage('Análise pausada após falha. Verifique a conexão e retome.');
        showToast('A análise foi pausada após uma falha. Verifique a câmera e a conexão antes de retomar.', { type: 'error' });
      }
    } finally {
      clearTimeout(timeout);
      if (canvas) { canvas.width = 0; canvas.height = 0; }
      blob = null;
      if (requestRef.current === controller) requestRef.current = null;
      if (mountedRef.current && generation === generationRef.current) {
        setProcessing(false);
        if (modeRef.current === 'running') timerRef.current = setTimeout(() => sample(generation), Math.max(0, interval * 1000 - (performance.now() - cycleStart)));
      }
    }
  };

  const startAnalysis = async () => {
    if (!Number.isInteger(Number(interval)) || Number(interval) < 1) {
      setError('Informe um intervalo inteiro de pelo menos 1 segundo.');
      showToast('Informe um intervalo inteiro de pelo menos 1 segundo.', { type: 'warning' });
      return;
    }
    setBusy(true); setError('');
    try {
      if (!streamRef.current && !(await openCamera())) return;
      failuresRef.current = 0;
      changeMode('running');
      startedAtRef.current = performance.now();
      setMessage('Análise em andamento.');
      const generation = ++generationRef.current;
      void sample(generation);
    } catch (err) {
      releaseCamera();
      if (mountedRef.current) {
        const mensagem = cameraError(err);
        setError(mensagem);
        showToast(mensagem, { type: 'error' });
      }
    }
    finally { if (mountedRef.current) setBusy(false); }
  };
  const pause = () => {
    cancelAnalysis(); stopClock(); releaseCamera(); changeMode('paused');
    setMessage('Câmera e análise pausadas. O tempo da pausa não será contado.');
  };
  const finalize = async () => {
    if (modeRef.current !== 'ended') {
      cancelAnalysis(); stopClock(); releaseCamera(); changeMode('ended');
    }
    setBusy(true); setError('');
    const valid = pointsRef.current.filter((point) => point.media_momento != null);
    if (!valid.length) {
      setMessage('Aula encerrada sem leituras válidas. Não há análise para salvar.');
      showToast('A aula foi encerrada sem leituras válidas. Não há análise para salvar.', { type: 'warning' });
      setBusy(false);
      return;
    }
    let resultadosSalvos = saved;
    try {
      if (!saved) {
        setMessage('Salvando resultados numéricos da aula...');
        await api.patch(`/aula/${idAula}/analise`, {
          analise: {
            status: 'sucesso',
            media_global_aula: Number((valid.reduce((sum, point) => sum + point.media_momento, 0) / valid.length).toFixed(2)),
            // Mantém o contrato existente. Leituras sem detecção ficam apenas na tela.
            linha_do_tempo: valid,
          }
        });
        if (!mountedRef.current) return;
        setSaved(true);
        resultadosSalvos = true;
      }
      setMessage('Gerando feedbacks finais...');
      const response = await api.get(`/feedback/aula/${idAula}/completo`);
      if (!mountedRef.current) return;
      setFeedback(response.data); setMessage('Aula encerrada. Resultados salvos e feedbacks disponíveis.');
      showToast('Aula encerrada! Resultados salvos e feedbacks disponíveis.', { type: 'success' });
    } catch (err) {
      if (mountedRef.current) {
        setError(err.response?.data?.message || err.message);
        setMessage('Aula encerrada. Tente concluir novamente pelo botão abaixo.');
        showToast(resultadosSalvos
          ? 'Os resultados foram salvos, mas não foi possível gerar os feedbacks. Tente novamente.'
          : 'Não foi possível salvar os resultados da aula. Tente novamente.',
        { type: 'error' });
      }
    }
    finally { if (mountedRef.current) setBusy(false); }
  };

  const valid = points.filter((point) => point.media_momento != null);
  const last = points[points.length - 1];
  const average = valid.length ? valid.reduce((sum, point) => sum + point.media_momento, 0) / valid.length : null;
  const recent = valid.slice(-5);
  const previous = valid.slice(-10, -5);
  const difference = previous.length === 5 && recent.length === 5
    ? recent.reduce((sum, point) => sum + point.media_momento, 0) / 5 - previous.reduce((sum, point) => sum + point.media_momento, 0) / 5 : null;
  const locked = busy || mode === 'running' || mode === 'ended';
  if (!idAula) return null;
  return (
    <div className="live-page">
      <Header routes={[{ textButton: 'Início', routeButton: '/inicial-professor' }, { textButton: 'Sobre o Projeto', routeButton: "/" }, { textButton: 'Perfil', routeButton: '/editar-dados' }]} />
      <main className="live-content">
        <h1>Análise de Aula em Tempo Real</h1>
        <div className="live-grid">
          <section className="live-card">
            <h2>Configurações da Análise</h2>
            <div className="live-inputs">
              <label>Câmera<select value={deviceId} disabled={locked} onChange={(event) => { releaseCamera(); setDeviceId(event.target.value); }}>
                {!devices.length && <option value="">Câmera padrão</option>}
                {devices.map((device, index) => <option key={device.deviceId || index} value={device.deviceId}>{device.label || `Câmera ${index + 1}`}</option>)}
              </select></label>
              <label>Intervalo (s)<input type="number" min="1" step="1" value={interval} disabled={locked} onChange={(event) => setInterval(event.target.value === '' ? '' : Number(event.target.value))} /></label>
              <label>Modelo<select value={String(model)} disabled={locked || valid.length > 0} onChange={(event) => setModel(event.target.value === 'true')}><option value="false">MODELO 1</option><option value="true">MODELO 2</option></select></label>
            </div>
            <div className="live-video">
              <video ref={videoRef} autoPlay playsInline muted hidden={!preview} />
              {!preview && <div><strong>{mode === 'paused' ? 'Câmera pausada' : mode === 'ended' ? 'Aula encerrada' : 'Câmera desligada'}</strong><p>{mode === 'idle' ? 'Visualize a sala antes de iniciar a análise.' : 'A câmera está desligada.'}</p></div>}
              {preview && <span className="live-badge">{mode === 'running' ? 'Analisando' : 'Prévia da câmera'}</span>}
            </div>
            <div className="live-buttons">
              {mode === 'idle' && <><button className="live-secondary" disabled={busy} onClick={previewCamera}>{preview ? 'Atualizar câmeras / prévia' : 'Visualizar câmera'}</button><button className="live-primary" disabled={busy} onClick={startAnalysis}>Iniciar análise</button></>}
              {mode === 'running' && <button className="live-secondary" disabled={busy} onClick={pause}>Pausar</button>}
              {mode === 'paused' && <button className="live-primary" disabled={busy} onClick={startAnalysis}>Retomar análise</button>}
              {(mode === 'running' || mode === 'paused') && <button className="live-finish" disabled={busy} onClick={finalize}>Encerrar aula</button>}
              {mode === 'ended' && !feedback && valid.length > 0 && <button className="live-primary" disabled={busy} onClick={finalize}>{busy ? 'Concluindo...' : saved ? 'Buscar feedbacks novamente' : 'Tentar salvar e concluir'}</button>}
            </div>
            <p className="live-status" role="status">{message}</p>
            {error && <p className="live-error" role="alert">{error}</p>}
            <p className="live-note">Sem gravação de vídeo ou armazenamento de imagens nesta tela. A câmera é usada para capturas temporárias enviadas à análise.</p>
          </section>
          <section className="live-results" aria-label="Resultados da análise">
            <div className="live-card">
              <div className="live-heading"><h2>{mode === 'ended' ? 'Resumo da Aula' : 'Resultados Parciais'}</h2><span>{formatTime(elapsed)} de análise</span></div>
              <div className="live-metrics"><div><span>Atenção atual</span><strong>{formatValue(last?.media_momento)}</strong></div><div><span>Média da aula</span><strong>{formatValue(average)}</strong></div></div>
              <p className="live-note">{valid.length} leituras válidas · {processing ? 'Processando captura...' : last ? `Última captura: ${formatTime(last.segundo_video)}` : 'Aguardando a primeira captura.'}</p>
              {last && <p className="live-note">Focados: {last.total_focados} · Distraídos: {last.total_distraidos}</p>}
            </div>
            <div className="live-card"><h2>Nível de Atenção ao Longo do Tempo</h2>
              {points.length ? <GenericLineChart data={points} xKey="segundo_video" lines={[{ key: 'media_momento', label: 'Atenção média', color: '#4f46e5' }]} formatXAxis={formatTime} isAnimationActive={false} connectNulls={false} /> : <div className="live-placeholder"><span>📊</span><h3>Aguardando Análise</h3><p>O gráfico será atualizado conforme as imagens forem processadas.</p></div>}
              <p className="live-note">Tempo ativo da análise, sem contar pausas. Valores na escala retornada pelo modelo.</p>
            </div>
            {difference != null && <div className="live-card"><h2>Comparativo da Aula Atual</h2><p>A média das últimas 5 leituras {difference > 0 ? 'aumentou' : difference < 0 ? 'diminuiu' : 'se manteve'}{difference !== 0 ? ` em ${formatValue(Math.abs(difference))} pontos` : ''} em relação às 5 anteriores.</p><p className="live-note">Comparação descritiva de leituras válidas; não é uma recomendação automática.</p></div>}
            {mode === 'ended' && feedback && <div className="live-card"><h2>Resultados da Análise</h2><FeedbackCards section={feedback.lesson} sectionTitle="Feedbacks da Aula Atual" /><FeedbackCards section={feedback.history} sectionTitle="Comparativo do Histórico" /></div>}
          </section>
        </div>
      </main>
    </div>
  );
}
