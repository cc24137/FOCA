import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Header from '../../components/header';
import AreaUploadVideo from '../../components/area-upload-video';
import GenericLineChart from '../../components/time-vs-value-chart';
import FeedbackCards from '../../components/feedback-cards';
import api from '../../services/api';
import './upload-video.css';

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
  const videoRef = useRef(null);

  const { idAula } = location.state || {};

  useEffect(() => {
    if (!idAula) {
      alert('Aula não informada. Voltando para o cadastro...');
      navigate('/cadastro-aula');
    }
  }, [idAula, navigate]);

  const [selectedFiles, setSelectedFiles] = useState([]);
  const [videoUrl, setVideoUrl] = useState(null);
  const [intervalInSeconds, setIntervalInSeconds] = useState(2);
  const [selectedModel, setSelectedModel] = useState('MODELO_1');
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [feedbackData, setFeedbackData] = useState(null);
  const [visionData, setVisionData] = useState(null);

  useEffect(() => {
    if (selectedFiles && selectedFiles.length > 0) {
      const url = URL.createObjectURL(selectedFiles[0]);
      setVideoUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setVideoUrl(null);
    }
  }, [selectedFiles]);

  const handleSeekVideo = (seconds) => {
    if (!videoRef.current || seconds === undefined || seconds === null) return;
    videoRef.current.currentTime = seconds;
    videoRef.current.pause();
  };

  const handleChartClick = (e) => {
    if (!e) return;

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
      handleSeekVideo(targetTime);
    }
  };

  const handleRemoveVideo = () => {
    setSelectedFiles([]);
    setVideoUrl(null);
    setVisionData(null);
    setFeedbackData(null);
    setStatusMessage('');
  };

  const handleProcessar = async () => {
    if (!selectedFiles || selectedFiles.length === 0) {
      alert("Selecione um vídeo primeiro.");
      return;
    }

    try {
      setLoading(true);

      setStatusMessage('1/4 Extraindo frames do vídeo...');
      const frames = await extractFrames(selectedFiles[0], Number(intervalInSeconds));

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
      
      setVisionData(visionResult);

      setStatusMessage('3/4 Guardando dados da análise...');
      await api.patch(`/aula/${idAula}/analise`, { 
        analise: visionResult,
        arquivoVideo: selectedFiles[0]?.name
      });

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

  return (
    <div className="upload-page-wrapper">
      <Header
        routes={[
          { textButton: "Início", routeButton: "/inicial-professor" },
          { textButton: "Sobre o Projeto", routeButton: "/" },
          { textButton: "Perfil", routeButton: "/editar-dados" }
        ]}
      />

      <div className="upload-page-content">
        <h1 className="page-title">Upload e Análise de Vídeo</h1>

        <div className="upload-main-grid">
          
          <div className="upload-column-left">
            <div className="config-card">
              <h2 className="card-title">Configurações do Processamento</h2>
              
              <div className="config-inputs-row">
                <label className="config-label">
                  Intervalo (s):
                  <input
                    type="number"
                    value={intervalInSeconds}
                    onChange={(e) => setIntervalInSeconds(e.target.value)}
                    disabled={loading || !!visionData}
                    className="input-number"
                  />
                </label>

                <label className="config-label">
                  Modelo:
                  <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    disabled={loading || !!visionData}
                    className="select-model"
                  >
                    <option value="MODELO_1">MODELO 1</option>
                    <option value="MODELO_2">MODELO 2</option>
                  </select>
                </label>
              </div>

              {videoUrl ? (
                <div className="video-player-container">
                  <video ref={videoRef} src={videoUrl} controls className="video-element" />
                </div>
              ) : (
                <AreaUploadVideo
                  selectedFiles={selectedFiles}
                  setSelectedFiles={setSelectedFiles}
                />
              )}

              <div className="action-buttons-group">
                {selectedFiles.length > 0 && !visionData && (
                  <button
                    onClick={handleProcessar}
                    disabled={loading}
                    className="btn-primary"
                  >
                    {loading ? 'Processando...' : 'Iniciar Análise'}
                  </button>
                )}

                {selectedFiles.length > 0 && (
                  <button
                    onClick={handleRemoveVideo}
                    disabled={loading}
                    className="btn-secondary"
                  >
                    Enviar outro vídeo
                  </button>
                )}
              </div>

              {statusMessage && (
                <p className={`status-message ${loading ? 'loading' : 'success'}`}>
                  {statusMessage}
                </p>
              )}
            </div>
          </div>

          <div className="upload-column-right">
            {visionData ? (
              <>
                {visionData.linha_do_tempo && (
                  <div className="chart-card">
                    <h3>Nível de Atenção ao Longo do Tempo</h3>
                    <GenericLineChart
                      data={visionData.linha_do_tempo}
                      xKey="segundo_video"
                      lines={[{ key: 'media_momento', label: 'Atenção Média', color: '#4F46E5' }]}
                      onClick={handleChartClick}
                    />
                  </div>
                )}

                {feedbackData && (
                  <div className="results-card">
                    <h2>Resultados da Análise</h2>
                    
                    <FeedbackCards
                      section={feedbackData.lesson}
                      sectionTitle="Feedbacks da Aula Atual"
                      onSelectInterval={handleSeekVideo}
                    />

                    <FeedbackCards
                      section={feedbackData.history}
                      sectionTitle="Comparativo do Histórico"
                      onSelectInterval={handleSeekVideo}
                    />
                  </div>
                )}
              </>
            ) : (
              <div className="placeholder-results-card">
                <div className="placeholder-icon">📊</div>
                <h3>Aguardando Processamento</h3>
                <p>Assim que a análise for iniciada, o gráfico de atenção e os feedbacks detalhados aparecerão aqui.</p>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}