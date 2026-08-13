import React, { useState, useEffect, useRef, useCallback } from 'react';

export default function CameraApp() {
  // Referências para elementos DOM e objetos de stream
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const workerRef = useRef(null);

  // Estados da aplicação
  const [devices, setDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isAutoSending, setIsAutoSending] = useState(false);
  const [intervalSeconds, setIntervalSeconds] = useState(5);
  const [statusMessage, setStatusMessage] = useState('Aguardando inicialização...');
  
  // Estado para armazenar as fotos tiradas na tela
  const [capturedPhotos, setCapturedPhotos] = useState([]);

  // 1. Inicializa o Web Worker (roda em segundo plano sem travar o timer na aba minimizada)
  useEffect(() => {
    const workerCode = `
      let timer = null;
      self.onmessage = function(e) {
        if (e.data.action === 'start') {
          clearInterval(timer);
          timer = setInterval(() => {
            self.postMessage('tick');
          }, e.data.interval);
        } else if (e.data.action === 'stop') {
          clearInterval(timer);
        }
      };
    `;

    const blob = new Blob([workerCode], { type: 'application/javascript' });
    const workerUrl = URL.createObjectURL(blob);
    workerRef.current = new Worker(workerUrl);

    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        URL.revokeObjectURL(workerUrl);
      }
    };
  }, []);

  // 2. Busca a lista de câmeras conectadas no computador
  const listCameras = async () => {
    try {
      const tempStream = await navigator.mediaDevices.getUserMedia({ video: true });
      tempStream.getTracks().forEach((track) => track.stop());

      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = allDevices.filter((device) => device.kind === 'videoinput');

      setDevices(videoInputs);

      if (videoInputs.length > 0 && !selectedDeviceId) {
        setSelectedDeviceId(videoInputs[0].deviceId);
      }
      setStatusMessage('Câmeras detectadas com sucesso.');
    } catch (err) {
      console.error('Erro ao listar dispositivos:', err);
      setStatusMessage('Erro ao acessar permissão de câmera. Verifique o navegador.');
    }
  };

  useEffect(() => {
    listCameras();
  }, []);

  // 3. Função para Tirar a Foto e Mostrar na Tela (SEM ENVIAR PARA API)
  const captureFrame = useCallback(async () => {
    if (!streamRef.current || !canvasRef.current) return;

    const track = streamRef.current.getVideoTracks()[0];
    if (!track || track.readyState !== 'live') return;

    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    try {
      // Captura o frame usando ImageCapture ou Canvas
      if ('ImageCapture' in window) {
        const imageCapture = new ImageCapture(track);
        const frame = await imageCapture.grabFrame();
        canvas.width = frame.width;
        canvas.height = frame.height;
        context.drawImage(frame, 0, 0);
      } else if (videoRef.current) {
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      }

      // Converte a imagem do Canvas para URL de dados (Base64)
      const imageUrl = canvas.toDataURL('image/jpeg', 0.85);
      const timestamp = new Date().toLocaleTimeString();

      // Salva a foto no estado (mantém as últimas 10 fotos salvas na tela)
      setCapturedPhotos((prevPhotos) => [
        { id: Date.now(), url: imageUrl, time: timestamp },
        ...prevPhotos.slice(0, 9), // Guarda até 10 fotos no histórico
      ]);

      setStatusMessage(`[${timestamp}] Foto tirada e mostrada na galeria abaixo!`);
    } catch (err) {
      console.error('Erro ao capturar foto:', err);
    }
  }, []);

  // 4. Recebe o sinal do Web Worker para disparar a foto
  useEffect(() => {
    if (!workerRef.current) return;

    workerRef.current.onmessage = (e) => {
      if (e.data === 'tick') {
        captureFrame();
      }
    };
  }, [captureFrame]);

  // 5. Controla o tempo automático do Web Worker
  useEffect(() => {
    if (!workerRef.current) return;

    if (isAutoSending && isStreaming) {
      workerRef.current.postMessage({
        action: 'start',
        interval: intervalSeconds * 1000,
      });
    } else {
      workerRef.current.postMessage({ action: 'stop' });
    }
  }, [isAutoSending, isStreaming, intervalSeconds]);

  // 6. Iniciar Câmera
  const startCamera = async () => {
    stopCamera();

    try {
      const constraints = {
        video: {
          deviceId: selectedDeviceId ? { exact: selectedDeviceId } : true,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      setIsStreaming(true);
      setStatusMessage('Câmera iniciada com sucesso.');
    } catch (err) {
      console.error('Erro ao iniciar câmera:', err);
      setStatusMessage('Falha ao abrir câmera. Verifique se outro app está usando-a.');
    }
  };

  // 7. Parar Câmera
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsStreaming(false);
    setIsAutoSending(false);
    setStatusMessage('Câmera desligada.');
  };

  return (
    <div style={styles.container}>
      <h2>Painel de Teste de Câmera USB</h2>

      {/* Seleção de Câmera */}
      <div style={styles.card}>
        <label style={styles.label}>Selecione a Câmera USB:</label>
        <div style={{ display: 'flex', gap: '10px' }}>
          <select
            value={selectedDeviceId}
            onChange={(e) => setSelectedDeviceId(e.target.value)}
            disabled={isStreaming}
            style={styles.select}
          >
            {devices.map((device, index) => (
              <option key={device.deviceId} value={device.deviceId}>
                {device.label || `Câmera ${index + 1}`}
              </option>
            ))}
          </select>
          <button onClick={listCameras} disabled={isStreaming} style={styles.buttonSecondary}>
            Atualizar Câmeras
          </button>
        </div>
      </div>

      {/* Preview ao Vivo */}
      <div style={styles.videoContainer}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{ ...styles.video, display: isStreaming ? 'block' : 'none' }}
        />
        {!isStreaming && <p style={{ color: '#aaa' }}>Câmera desligada</p>}
      </div>

      {/* Canvas invisível */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* Botões de Controle */}
      <div style={styles.controlsRow}>
        {!isStreaming ? (
          <button onClick={startCamera} style={styles.buttonPrimary}>
            Ligar Câmera
          </button>
        ) : (
          <button onClick={stopCamera} style={styles.buttonDanger}>
            Desligar Câmera
          </button>
        )}

        <button onClick={captureFrame} disabled={!isStreaming} style={styles.buttonSecondary}>
          Tirar Foto Agora
        </button>
      </div>

      {/* Configuração de Timer Automático */}
      {isStreaming && (
        <div style={styles.card}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={isAutoSending}
              onChange={(e) => setIsAutoSending(e.target.checked)}
            />
            <b>Tirar foto automaticamente a cada</b>
          </label>
          <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="number"
              min="1"
              value={intervalSeconds}
              onChange={(e) => setIntervalSeconds(Math.max(1, Number(e.target.value)))}
              style={{ ...styles.input, width: '80px' }}
            />
            <span>segundos (continua tirando fotos mesmo com a aba minimizada)</span>
          </div>
        </div>
      )}

      {/* Caixa de Status */}
      <div style={styles.statusBox}>
        <strong>Status:</strong> {statusMessage}
      </div>

      {/* GALERIA DE FOTOS CAPTURADAS */}
      <div style={{ marginTop: '25px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3>Fotos Capturadas ({capturedPhotos.length})</h3>
          {capturedPhotos.length > 0 && (
            <button onClick={() => setCapturedPhotos([])} style={styles.clearButton}>
              Limpar Galeria
            </button>
          )}
        </div>

        {capturedPhotos.length === 0 ? (
          <p style={{ color: '#777', fontStyle: 'italic' }}>Nenhuma foto tirada ainda.</p>
        ) : (
          <div style={styles.galleryGrid}>
            {capturedPhotos.map((photo) => (
              <div key={photo.id} style={styles.photoCard}>
                <img src={photo.url} alt="Captura da câmera" style={styles.photoImg} />
                <span style={styles.photoTime}>{photo.time}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Estilos do componente
const styles = {
  container: {
    maxWidth: '680px',
    margin: '30px auto',
    padding: '20px',
    fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif',
    backgroundColor: '#f9f9f9',
    borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
  },
  card: {
    backgroundColor: '#fff',
    padding: '12px 16px',
    borderRadius: '8px',
    marginBottom: '15px',
    border: '1px solid #e2e8f0',
  },
  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: 'bold',
    marginBottom: '6px',
    color: '#333',
  },
  input: {
    padding: '8px 12px',
    borderRadius: '6px',
    border: '1px solid #ccc',
  },
  select: {
    flex: 1,
    padding: '8px 12px',
    borderRadius: '6px',
    border: '1px solid #ccc',
  },
  videoContainer: {
    width: '100%',
    height: '380px',
    backgroundColor: '#1a1a1a',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: '15px',
  },
  video: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  controlsRow: {
    display: 'flex',
    gap: '12px',
    marginBottom: '15px',
  },
  buttonPrimary: {
    flex: 1,
    padding: '10px',
    backgroundColor: '#2563eb',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: 'bold',
  },
  buttonSecondary: {
    padding: '10px 16px',
    backgroundColor: '#475569',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  buttonDanger: {
    flex: 1,
    padding: '10px',
    backgroundColor: '#dc2626',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: 'bold',
  },
  clearButton: {
    padding: '4px 8px',
    backgroundColor: '#ef4444',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    fontSize: '12px',
    cursor: 'pointer',
  },
  statusBox: {
    padding: '12px',
    backgroundColor: '#e2e8f0',
    borderRadius: '6px',
    fontSize: '13px',
    color: '#334155',
  },
  galleryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
    gap: '12px',
    marginTop: '10px',
  },
  photoCard: {
    backgroundColor: '#fff',
    padding: '6px',
    borderRadius: '6px',
    border: '1px solid #ddd',
    textAlign: 'center',
  },
  photoImg: {
    width: '100%',
    height: '100px',
    objectFit: 'cover',
    borderRadius: '4px',
  },
  photoTime: {
    fontSize: '11px',
    color: '#666',
    marginTop: '4px',
    display: 'block',
  },
};