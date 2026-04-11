import "./area-upload-video.css";
import { useRef, useState } from "react";

export default function AreaUploadVideo({ selectedFiles = [], setSelectedFiles }) {

    const inputRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);

    function handleFiles(files) {
        const validVideos = Array.from(files).filter(file =>
            file.type.startsWith("video/")
        );

        if (validVideos.length === 0) {
            alert("Only video files are allowed.");
            return;
        }

        setSelectedFiles(prevFiles => [...prevFiles, ...validVideos]);
    }

    function handleDrop(e) {
        e.preventDefault();
        setIsDragging(false);

        const files = e.dataTransfer.files;
        handleFiles(files);
    }

    function handleDragOver(e) {
        e.preventDefault();
        setIsDragging(true);
    }

    function removeFile(indexToRemove) {
        setSelectedFiles(prevFiles =>
            prevFiles.filter((_, index) => index !== indexToRemove)
        );
    }

    function handleDragLeave(e) {
       e.preventDefault();
        setIsDragging(false);
    }

    function handleChange(e) {
        handleFiles(e.target.files);
        e.target.value = ""; // Reset the input to allow selecting the same file again if needed
    }

    return(
        <div>
            <div
                onClick={() => inputRef.current.click()}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={`dropzone ${isDragging ? "dragging" : ""}`}
            >
                {selectedFiles.length > 0 ? (
                <ul>
                    {selectedFiles.map((file, index) => (
                    <li key={index}>
                        <span>{file.name}</span>
                        <button
                            className="remove-btn"
                            onClick={(e) => {
                                e.stopPropagation(); // evita abrir o input
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
                accept="video/*"
                multiple={true}
                ref={inputRef}
                onChange={handleChange}
                style={{ display: "none" }}
            />
        </div>
    );
}