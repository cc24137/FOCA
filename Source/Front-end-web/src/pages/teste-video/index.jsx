// import { useNavigate } from 'react-router-dom';
// import "./teste-video.css";
// import DropzoneUploadVideo from "../components/area-upload-video";
// import { useState } from "react";
// import LoadZone from "../components/carregamento";
// import AreaFrameVideo from "../components/area-frame-video";

// export default function TesteVideo(){

//     const [mode, setMode] = useState("upload");
//     const [selectedFiles, setSelectedFiles] = useState([]);

//     return (
//         <div className="teste-video-container">
//             <h1>Teste Video</h1>

//             {mode === "loading" && <LoadZone />}
//             {mode === "upload" && <DropzoneUploadVideo selectedFiles={selectedFiles} setSelectedFiles={setSelectedFiles} />}
//             {mode === "preview" && <AreaFrameVideo videos={selectedFiles} />}  

//             <button onClick={() => setMode("upload")}>Upload</button>
//             <button onClick={() => setMode("loading")}>Loading</button>
//             <button onClick={() => setMode("preview")}>Preview</button>
//         </div>
        


//     )
// }

import Header from '../../components/header';
import AreaUploadVideo from '../../components/area-upload-video';  
import './teste-video.css';
import { useState } from 'react';
import IconTexto from '../../assets/file-text.svg?react';



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
          URL.revokeObjectURL(video.src); // Limpa a memória da URL temporária
          resolve(frames);
          return;
        }
        video.currentTime = currentTime;
      };

      video.onseeked = () => {
        // Desenha o frame atual do vídeo dentro do Canvas
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Converte o canvas para um arquivo JPG de qualidade leve
        canvas.toBlob((blob) => {
          if (blob) frames.push(blob);
          currentTime += intervalInSeconds;
          captureNextFrame();
        }, 'image/jpeg', 0.8);
      };

      // Inicia o fluxo
      captureNextFrame();
    };
  });
};


export default function TesteVideo() {
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [loading, setLoading] = useState(false)
    const [intervalInSeconds, setIntervalInSeconds] = useState(2);

    const handleProcessVideo_para_frames = async () => {
        if (!selectedFiles || selectedFiles.length === 0) return;

        try {
            setLoading(true);
            // 1. Extrai os frames do arquivo selecionado
            const frames = await extractFrames(selectedFiles[0], Number(intervalInSeconds));

            // 2. Monta o FormData contendo todos os frames
            const formData = new FormData();

            formData.append('intervalo_segundos', intervalInSeconds);

            frames.forEach((frameBlob, index) => {
                formData.append('frames', frameBlob, `frame_${index}.jpg`);
            });

            // 3. Envia o array de imagens para sua API de Visão Computacional
            const response = await fetch('http://127.0.0.1:8000/processar-frames', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok){
                console.log("Não tá ok")
                console.error('Erro de validação do FastAPI (422):', data.detail);
            }

            const data = await response.json();
            console.log('Resultados da API:', data);

        } catch (error) {
            console.error('Erro na extração ou envio:', error);
        } finally {
            setLoading(false);
        }
    };


    const handleProcessVideo = async () => {


        console.log("Entrou na função handleProcessVideo");

        if (!selectedFiles || selectedFiles.length === 0) {
            //alert("Selecione um arquivo de vídeo primeiro.");
            console.log("Selecione um arquivo primeiro")
            return;
        }

        const formData = new FormData();
        formData.append('file', selectedFiles[0]); 

        try {
            const response = await fetch('http://127.0.0.1:8000/processar-video', {
                method: 'POST',
                body: formData, 
            });

            const result = await response.json();
            console.log('Resultado do modelo de visão computacional:', result);
        } catch (error) {
            console.error('Erro ao enviar para a API:', error);
        }
    };

    return (
        <div className='teste-video-body'>
            <Header />
            
            <div className='teste-video-content'>
                <div className='area-upload'>
                    <p className='teste-video-upload-aulas-title'>Faça o upload da gravação da aula</p>
                    
                    {/* Props enviadas para o componente funcionar corretamente */}
                    <AreaUploadVideo 
                        selectedFiles={selectedFiles} 
                        setSelectedFiles={setSelectedFiles} 
                    />

                    <button className='teste-video-processar' disabled={loading} onClick={handleProcessVideo_para_frames}> 
                        <div className='teste-video-processar-row'>
                            <p className='teste-video-processar-row-text'>Processar Video</p>
                        </div>
                    </button>
                </div>

                <div className='teste-video-historico-aulas'>
                    <p className='teste-video-historico-aulas-title'>Linha do tempo de atenção </p>
                    <div className='teste-video-historico-aulas-content'>
                    
                    </div>

                    <button className='teste-video-salvar'> 
                        <div className='teste-video-salvar-row'>
                            <IconTexto className='teste-video-salvar-row-icon' />
                            <p className='teste-video-salvar-row-text'>Gerar PDF</p>
                        </div>
                    </button>
                </div>
            </div>
        </div>
    );
}