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


import Header from '../components/header';
import AreaUploadVideo from '../components/area-upload-video';  
import './teste-video.css';
import { useState } from 'react';
import IconTexto from '../assets/file-text.svg?react';

export default function TesteVideo(){

    return (
        <div className='teste-video-body'>
            <Header />
            
            <div className='teste-video-content'>
                <div className='area-upload'>
                    <p className='teste-video-upload-aulas-title'>Faça o upload da gravação da aula</p>
                    <AreaUploadVideo />

                    <button className='teste-video-processar'> 
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
    )
}