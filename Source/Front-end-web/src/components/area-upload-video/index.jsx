import "./area-upload-video.css";
import { useRef, useState } from "react";

export default function AreaUploadVideo({ selectedFiles = [], setSelectedFiles }) {
    const inputRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);

    function handleFiles(files) {
        if (!files || files.length === 0) return;

        // Filtra vídeos verificando a propriedade file.type OU a extensão no nome do arquivo
        const validVideos = Array.from(files).filter(file => {
            const isVideoType = file.type && file.type.startsWith("video/");
            const isVideoExtension = /\.(mp4|mov|avi|mkv|webm|m4v)$/i.test(file.name);
            return isVideoType || isVideoExtension;
        });

        if (validVideos.length === 0) {
            alert("Apenas arquivos de vídeo são permitidos.");
            return;
        }

        if (typeof setSelectedFiles === "function") {
            setSelectedFiles(prevFiles => [...prevFiles, ...validVideos]);
        } else {
            console.error("A propriedade 'setSelectedFiles' não foi enviada para o AreaUploadVideo.");
        }
    }

    function handleDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFiles(e.dataTransfer.files);
        }
    }

    function handleDragOver(e) {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    }

    function handleDragLeave(e) {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }

    function handleChange(e) {
        if (e.target.files) {
            handleFiles(e.target.files);
            e.target.value = ""; // Limpa para permitir selecionar o mesmo arquivo novamente
        }
    }

    function removeFile(indexToRemove) {
        if (typeof setSelectedFiles === "function") {
            setSelectedFiles(prevFiles =>
                prevFiles.filter((_, index) => index !== indexToRemove)
            );
        }
    }

    return (
        <div>
            <div
                onClick={() => inputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={`dropzone ${isDragging ? "dragging" : ""}`}
            >
                {selectedFiles.length > 0 ? (
                    <ul onClick={(e) => e.stopPropagation()}>
                        {selectedFiles.map((file, index) => (
                            <li key={index} className="file-item">
                                <span>{file.name}</span>
                                <button
                                    type="button"
                                    className="remove-btn"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        removeFile(index);
                                    }}
                                >
                                    ×
                                </button>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p>Arraste um vídeo aqui ou clique para selecionar</p>
                )}
            </div>

            <input
                type="file"
                accept="video/*,.mp4,.mov,.avi,.mkv"
                multiple={true}
                ref={inputRef}
                onChange={handleChange}
                style={{ display: "none" }}
            />
        </div>
    );
}