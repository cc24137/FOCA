import "./carregamento.css";

export default function LoadZone() {
    return (
        <div className="loading-area">
            <div className="spinner"></div>
            <p>Processando vídeo...</p>
        </div>
    );
}