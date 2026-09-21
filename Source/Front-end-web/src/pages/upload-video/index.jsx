import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Header from '../../components/header';
import AreaUploadVideo from '../../components/area-upload-video';
import GenericLineChart from '../../components/time-vs-value-chart';
import api from '../../services/api';

// --- Função Utilitária para Extração de Frames ---
export const extractFrames = (videoFile, intervalInSeconds) => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const frames = [];

    video.src = URL.createObjectURL(videoFile);
    video.muted = true;

    video.onerror = () => reject("Erro ao carregar o vídeo.");

    video.onloadedmetadata = () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      let currentTime = 0;

      const captureNextFrame = () => {
        if (currentTime > video.duration) {
          URL.revokeObjectURL(video.src);
          resolve(frames);
          return;
        }
        video.currentTime = currentTime;
      };

      video.onseeked = () => {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          if (blob) frames.push(blob);
          currentTime += intervalInSeconds;
          captureNextFrame();
        }, 'image/jpeg', 0.8);
      };

      captureNextFrame();
    };
  });
};

export default function UploadVideo() {
  const location = useLocation();
  const navigate = useNavigate();

  // Referência para o elemento HTML de vídeo
  const videoRef = useRef(null);

  // 1. Recupera o idAula passado pelo navigate na tela anterior
  const { idAula } = location.state || {};

  // Redireciona se a aula não tiver sido informada
  useEffect(() => {
    if (!idAula) {
      alert('Aula não informada. Voltando para o cadastro...');
      navigate('/cadastro-aula');
    }
  }, [idAula, navigate]);

  // Estados locais
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [videoUrl, setVideoUrl] = useState(null);
  const [intervalInSeconds, setIntervalInSeconds] = useState(2);
  const [selectedModel, setSelectedModel] = useState('MODELO_1');
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [feedbackData, setFeedbackData] = useState(null);
  const [visionData, setVisionData] = useState(null);

  // Cria a URL de preview para o player assim que um vídeo for selecionado
  useEffect(() => {
    if (selectedFiles && selectedFiles.length > 0) {
      const url = URL.createObjectURL(selectedFiles[0]);
      setVideoUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setVideoUrl(null);
    }
  }, [selectedFiles]);

  // Mapeamento visual de cores por tom de feedback
  const toneColors = {
    positive: '#D1FAE5', // Verde
    warning: '#FEF3C7',  // Amarelo
    info: '#E0F2FE',     // Azul
    neutral: '#F3F4F6'   // Cinza
  };

  // Redireciona o tempo do vídeo quando clica em um ponto do gráfico e pausa a reprodução
  const handleChartClick = (e) => {
    if (!videoRef.current || !e) return;

    let targetTime = null;

    if (e.activePayload && e.activePayload.length > 0) {
      targetTime = e.activePayload[0].payload?.segundo_video;
    } else if (e.payload) {
      targetTime = e.payload.segundo_video;
    } else if (e.activeLabel !== undefined && e.activeLabel !== null) {
      targetTime = Number(e.activeLabel);
    } else if (typeof e.segundo_video !== 'undefined') {
      targetTime = e.segundo_video;
    } else if (typeof e === 'number') {
      targetTime = e;
    }

    if (targetTime !== null && targetTime !== undefined && !isNaN(targetTime)) {
      videoRef.current.currentTime = targetTime;
      videoRef.current.pause();
    }
  };

  // Limpa o vídeo selecionado para escolher outro
  const handleRemoveVideo = () => {
    setSelectedFiles([]);
    setVideoUrl(null);
    setVisionData(null);
    setFeedbackData(null);
    setStatusMessage('');
  };

  // 2. Fluxo Principal de Processamento
  const handleProcessar = async () => {
    if (!selectedFiles || selectedFiles.length === 0) {
      alert("Selecione um vídeo primeiro.");
      return;
    }

    try {
      setLoading(true);

      // PASSO 1: Extração de Frames
      setStatusMessage('1/4 Extraindo frames do vídeo...');
      const frames = await extractFrames(selectedFiles[0], Number(intervalInSeconds));

      // PASSO 2: Modelo de Visão Computacional (FastAPI)
      setStatusMessage('2/4 Processando análise de visão computacional...');
      const formData = new FormData();
      formData.append('intervalo_segundos', intervalInSeconds);
      
      // formData.append('modelo', selectedModel); // Futuro repasse do modelo

      frames.forEach((frameBlob, index) => {
        formData.append('frames', frameBlob, `frame_${index}.jpg`);
      });

      const visionRes = await fetch('http://127.0.0.1:8000/processar-frames', {
        method: 'POST',
        body: formData,
      });

      if (!visionRes.ok) throw new Error('Falha no modelo de visão computacional.');
      const visionResult = await visionRes.json();
      
      setVisionData(visionResult);

      // PASSO 3: Atualizar a aula no Backend Node.js
      setStatusMessage('3/4 Guardando dados da análise...');

      await api.patch(`/aula/${idAula}/analise`, { 
        totalAttentionAverage: visionResult.media_global_aula,
        analise: visionResult,
        arquivoVideo: selectedFiles[0]?.name
      });

      // PASSO 4: Buscar Feedbacks
      setStatusMessage('4/4 Gerando feedbacks e recomendações...');
      const responseFeedback = await api.get(`/feedback/aula/${idAula}/completo`);
      
      setFeedbackData(responseFeedback.data);
      setStatusMessage('Processamento concluído com sucesso!');

    } catch (error) {
      console.error("Erro no processamento:", error);
      setStatusMessage(`Erro: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const renderSection = (section, title) => {
    if (!section || (!section.items?.length && !section.recommendations?.length)) {
      return (
        <div style={{ padding: '15px', background: '#f8f9fa', marginBottom: '15px', borderRadius: '6px' }}>
          <h3>{title}</h3>
          <p style={{ color: '#6c757d' }}>{section?.summary?.description || 'Sem dados disponíveis.'}</p>
        </div>
      );
    }

    return (
      <div style={{ marginBottom: '24px', border: '1px solid #e2e8f0', padding: '16px', borderRadius: '8px', backgroundColor: '#fff' }}>
        <h3 style={{ marginTop: 0 }}>{title}</h3>
        <p style={{ color: '#4a5568', fontStyle: 'italic' }}>{section.summary?.description}</p>

        {section.items.map((item) => {
          const relatedRecs = section.recommendations?.filter((rec) =>
            rec.relatedFeedbackIds?.includes(item.id)
          ) || [];

          return (
            <div
              key={item.id}
              style={{
                backgroundColor: toneColors[item.tone] || '#ffffff',
                padding: '12px 16px',
                margin: '12px 0',
                borderRadius: '6px',
                borderLeft: '4px solid #4F46E5'
              }}
            >
              <strong>[{item.priority}] {item.title}</strong>
              <p style={{ margin: '6px 0 4px 0' }}>{item.message}</p>

              {item.interval && (
                <small style={{ color: '#6b7280' }}>
                  Intervalo: {item.interval.startSecond}s - {item.interval.endSecond}s
                </small>
              )}

              {relatedRecs.length > 0 && (
                <div style={{ marginTop: '10px', paddingLeft: '12px', borderLeft: '2px dashed #9ca3af' }}>
                  {relatedRecs.map((rec) => (
                    <div key={rec.id} style={{ marginTop: '6px' }}>
                      <strong>Sugestão: {rec.title}</strong>
                      <p style={{ margin: '2px 0' }}>{rec.message}</p>
                      {rec.actions && (
                        <ul style={{ margin: '4px 0', paddingLeft: '20px' }}>
                          {rec.actions.map((action, idx) => (
                            <li key={idx}>{action}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="upload-video-container" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', width: '100%' }}>
      <Header
        routes={[
          { textButton: "Início", routeButton: "/inicial-professor" },
          { textButton: "Sobre o Projeto", routeButton: "/" },
          { textButton: "Perfil", routeButton: "/editar-dados" }
        ]}
      />

      <div 
        className="upload-video-content" 
        style={{ 
          maxWidth: '900px', 
          width: '100%', 
          margin: '0 auto', 
          padding: '24px 16px', 
          boxSizing: 'border-box' 
        }}
      >
        <div style={{ marginBottom: '20px', padding: '16px', backgroundColor: '#EEF2FF', borderRadius: '8px' }}>
          <h2 style={{ margin: 0, color: '#312E81' }}>Upload e Análise de Vídeo</h2>
          <p style={{ margin: '8px 0 0 0', color: '#4338CA' }}>
            Aula ID: <strong>{idAula}</strong>
          </p>
        </div>

        {/* Opções de amostragem e modelo (visíveis desde o início) */}
        <div style={{ marginBottom: '16px', display: 'flex', gap: '24px', alignItems: 'center', flexWrap: 'wrap' }}>
          <label style={{ fontSize: '0.95rem', fontWeight: 500 }}>
            Intervalo de amostragem (segundos):
            <input
              type="number"
              value={intervalInSeconds}
              onChange={(e) => setIntervalInSeconds(e.target.value)}
              disabled={loading || !!visionData}
              style={{ marginLeft: '10px', width: '60px', padding: '4px 8px', borderRadius: '4px', border: '1px solid #ccc' }}
            />
          </label>

          <label style={{ fontSize: '0.95rem', fontWeight: 500 }}>
            Modelo de Análise:
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              disabled={loading || !!visionData}
              style={{ 
                marginLeft: '10px', 
                padding: '4px 10px', 
                borderRadius: '4px', 
                border: '1px solid #ccc',
                backgroundColor: (loading || !!visionData) ? '#f3f4f6' : '#ffffff',
                cursor: (loading || !!visionData) ? 'not-allowed' : 'pointer'
              }}
            >
              <option value="MODELO_1">MODELO 1</option>
              <option value="MODELO_2">MODELO 2</option>
            </select>
          </label>
        </div>

        {/* Player de preview imediato ou Área de Drag&Drop */}
        {videoUrl ? (
          <div style={{ marginBottom: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <video
              ref={videoRef}
              src={videoUrl}
              controls
              style={{
                width: '100%',
                maxHeight: '480px',
                borderRadius: '8px',
                backgroundColor: '#000',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
            />
            {!visionData && !loading && (
              <button
                onClick={handleRemoveVideo}
                style={{
                  marginTop: '8px',
                  background: 'transparent',
                  border: 'none',
                  color: '#EF4444',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  textDecoration: 'underline'
                }}
              >
                Escolher outro vídeo
              </button>
            )}
          </div>
        ) : (
          <AreaUploadVideo
            selectedFiles={selectedFiles}
            setSelectedFiles={setSelectedFiles}
          />
        )}

        {/* Botão de Disparo */}
        {selectedFiles.length > 0 && !visionData && (
          <div style={{ marginTop: '20px' }}>
            <button
              onClick={handleProcessar}
              disabled={loading}
              style={{
                padding: '10px 24px',
                backgroundColor: loading ? '#9CA3AF' : '#4F46E5',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '6px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '1rem',
                fontWeight: 600
              }}
            >
              {loading ? 'Processando...' : 'Iniciar Processamento e Análise'}
            </button>

            {statusMessage && (
              <p style={{ fontWeight: 600, marginTop: '12px', color: loading ? '#4B5563' : '#059669' }}>
                {statusMessage}
              </p>
            )}
          </div>
        )}

        {/* Gráfico e Feedbacks (somente após processar) */}
        {visionData && (
          <>
            <hr style={{ margin: '32px 0', borderColor: '#E5E7EB' }} />

            {visionData.linha_do_tempo && (
              <div style={{ marginBottom: '32px', backgroundColor: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid #E5E7EB' }}>
                <h3 style={{ marginTop: 0, marginBottom: '16px', color: '#1F2937' }}>Nível de Atenção ao Longo do Tempo</h3>
                <p style={{ fontSize: '0.875rem', color: '#6B7280', marginTop: '-10px', marginBottom: '16px' }}>
                  Clique em qualquer ponto do gráfico para pular para o segundo correspondente no vídeo.
                </p>
                <GenericLineChart
                  data={visionData.linha_do_tempo}
                  xKey="segundo_video"
                  lines={[
                    { key: 'media_momento', label: 'Atenção Média', color: '#4F46E5' }
                  ]}
                  onClick={handleChartClick}
                />
              </div>
            )}
          </>
        )}

        {feedbackData && (
          <div>
            <h2 style={{ marginBottom: '20px' }}>Resultados da Análise</h2>
            {renderSection(feedbackData.lesson, 'Feedbacks da Aula Atual')}
            {renderSection(feedbackData.history, 'Comparativo do Histórico')}
          </div>
        )}
      </div>
    </div>
  );
}