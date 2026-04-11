import { useNavigate } from 'react-router-dom';
import "./teste-video.css";
import DropzoneUploadVideo from "../components/area-upload-video";
import { useState } from "react";
import LoadZone from "../components/carregamento";
import AreaFrameVideo from "../components/area-frame-video";

export default function TesteVideo(){

    const [mode, setMode] = useState("upload");
    const [selectedFiles, setSelectedFiles] = useState([]);

    return (
        <div className="teste-video-container">
            <h1>Teste Video</h1>

            {mode === "loading" && <LoadZone />}
            {mode === "upload" && <DropzoneUploadVideo selectedFiles={selectedFiles} setSelectedFiles={setSelectedFiles} />}
            {mode === "preview" && <AreaFrameVideo videos={selectedFiles} />}  

            <button onClick={() => setMode("upload")}>Upload</button>
            <button onClick={() => setMode("loading")}>Loading</button>
            <button onClick={() => setMode("preview")}>Preview</button>
        </div>
        


    )
}