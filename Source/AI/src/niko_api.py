import os

import cv2
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

from niko_engine import NikoEngine

app = FastAPI(title="API FOCA")

# Inicializa a IA
engine = NikoEngine()

class VideoRequest(BaseModel):
    caminho_video: str
    intervalo_segundos: int = 5 # Processa 1 frame a cada 5 segundos

@app.post("/processar-video")
async def processar_video(requisicao: VideoRequest):
    # Aceita tanto caminho local quanto URL da internet (Streaming direto da nuvem)
    eh_url = requisicao.caminho_video.startswith("http://") or requisicao.caminho_video.startswith("https://")

    if not eh_url and not os.path.exists(requisicao.caminho_video):
        raise HTTPException(status_code=404, detail="Arquivo/URL de vídeo não encontrado.")

    cap = cv2.VideoCapture(requisicao.caminho_video)
    fps = cap.get(cv2.CAP_PROP_FPS)

    if fps <= 0: 
        fps = 30

    frames_para_pular = int(fps * requisicao.intervalo_segundos)

    medias_temporais = []
    linha_do_tempo = []
    contador_frames = 0

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break

        # Processa apenas o frame exato do intervalo
        if contador_frames % frames_para_pular == 0:
            resultado_frame = engine.processar_frame(frame)

            if resultado_frame and resultado_frame["total_alunos"] > 0:
                medias_temporais.append(resultado_frame["media_atencao"])

                # Monta a estrutura detalhada para os diferentes frames analisados -> usar pro gráfico da web dps
                segundo_atual = int(contador_frames / fps)
                linha_do_tempo.append({
                    "segundo_video": segundo_atual,
                    "media_momento": resultado_frame["media_atencao"],
                    "total_focados": resultado_frame["focados"],
                    "total_distraidos": resultado_frame["distraidos"]
                })

        contador_frames += 1

    cap.release()

    # Calcula a média geral do vídeo inteiro
    media_final_video = round(sum(medias_temporais) / len(medias_temporais), 2) if medias_temporais else 0.0

    return {
        "status": "sucesso",
        "video_processado": requisicao.caminho_video,
        "media_global_aula": media_final_video,
        "linha_do_tempo": linha_do_tempo
    }
