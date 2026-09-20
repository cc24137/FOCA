import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Header from '../../components/header';
import AreaUploadVideo from '../../components/area-upload-video';
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
  const [intervalInSeconds, setIntervalInSeconds] = useState(2);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [feedbackData, setFeedbackData] = useState(null);

  // Mapeamento visual simples de cores por tone de feedback
  const toneColors = {
    positive: '#D1FAE5', // Verde
    warning: '#FEF3C7',  // Amarelo
    info: '#E0F2FE',     // Azul
    neutral: '#F3F4F6'   // Cinza
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
      frames.forEach((frameBlob, index) => {
        formData.append('frames', frameBlob, `frame_${index}.jpg`);
      });

      const visionRes = await fetch('http://127.0.0.1:8000/processar-frames', {
        method: 'POST',
        body: formData,
      });

      if (!visionRes.ok) throw new Error('Falha no modelo de visão computacional.');
      const visionResult = await visionRes.json();

      // PASSO 3: Atualizar a aula no Backend Node.js usando o serviço api
      setStatusMessage('3/4 A guardar dados da análise...');

      await api.patch(`/aula/${idAula}/analise`, { 
        totalAttentionAverage: visionResult.media_global_aula,
        analise: visionResult,
        arquivoVideo: selectedFiles[0]?.name // <-- Adicionado o nome do ficheiro
      });

      // PASSO 4: Buscar os Feedbacks Completos da Metaheurística
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

  // Helper para renderizar seções de feedback (Aula / Histórico)
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
        <p style={{ color: '#4a5568', italic: 'true' }}>{section.summary?.description}</p>

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

              {/* Recomendações Associadas */}
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
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '20px', fontFamily: 'sans-serif' }}>
      <Header />

      <div style={{ marginBottom: '20px', padding: '16px', backgroundColor: '#EEF2FF', borderRadius: '8px' }}>
        <h2 style={{ margin: 0, color: '#312E81' }}>Upload e Análise de Vídeo</h2>
        <p style={{ margin: '8px 0 0 0', color: '#4338CA' }}>
          Aula ID: <strong>{idAula}</strong>
        </p>
      </div>

      {/* Opções de amostragem */}
      <div style={{ marginBottom: '16px' }}>
        <label style={{ fontSize: '0.95rem', fontWeight: 500 }}>
          Intervalo de amostragem (segundos):
          <input
            type="number"
            value={intervalInSeconds}
            onChange={(e) => setIntervalInSeconds(e.target.value)}
            style={{ marginLeft: '10px', width: '60px', padding: '4px 8px', borderRadius: '4px', border: '1px solid #ccc' }}
          />
        </label>
      </div>

      {/* Componente Dropzone de Vídeo */}
      <AreaUploadVideo
        selectedFiles={selectedFiles}
        setSelectedFiles={setSelectedFiles}
      />

      {/* Botão de Disparo do Processamento */}
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

      <hr style={{ margin: '32px 0', borderColor: '#E5E7EB' }} />

      {/* Exibição dos Resultados da Análise */}
      {feedbackData && (
        <div>
          <h2 style={{ marginBottom: '20px' }}>Resultados da Análise</h2>
          {renderSection(feedbackData.lesson, 'Feedbacks da Aula Atual')}
          {renderSection(feedbackData.history, 'Comparativo do Histórico')}
        </div>
      )}
    </div>
  );
}