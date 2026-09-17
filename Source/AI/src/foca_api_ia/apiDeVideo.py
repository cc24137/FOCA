from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import uvicorn
import shutil
import os
from huggingface_hub import hf_hub_download
from foca_engine import FocaEngine, VideoRequest
from typing import List
import numpy as np
import cv2

REPO_ID = "rafafazion/foca-yolov8-nano"
FILENAME = "best.pt"

model = {}

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Baixando o modelo...")
    try:
        model_path = hf_hub_download(
            repo_id=REPO_ID,
            filename=FILENAME
        )
        print("Modelo encontrado.")
        model["foca_engine"] = FocaEngine(model_path)
        print("Modelo carregado na memória.")

    except Exception as e:
        print(f"ERRO: Falha crítica ao carregar o modelo: {e}")
        raise e

    yield

    model.clear()
    print("Modelo liberado")

app = FastAPI(
    title="API da IA FOCA",
    lifespan=lifespan
)

# Configuração do CORS para permitir requisições da página HTML/Website
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Em produção, especifique o domínio do seu site
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Diretório para salvar os vídeos temporariamente antes de passar pra IA
UPLOAD_DIR = "uploaded_videos"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@app.post("/processar-frames/")
async def processar_frames(intervalo_segundos: int = Form(...), frames: List[UploadFile] = File(...)):
    if "foca_engine" not in model:
        raise HTTPException(status_code=503, detail="Modelo não inicializado.")
    if not frames:
        raise HTTPException(status_code=400, detail="Frames não recebidos.")

    medias_temporais = []
    linha_do_tempo = []
    qts_frames_passados = 0

    for index, file in enumerate(frames):
        qts_frames_passados += 1
        contents = await file.read()

        nparr = np.frombuffer(contents, np.uint8)
        img_opencv = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        resultado_frame = model["foca_engine"].processar_frame(img_opencv)

        if resultado_frame and resultado_frame["total_alunos"] > 0:

            medias_temporais.append(resultado_frame["media_atencao"])
            linha_do_tempo.append({
                "segundo_video": intervalo_segundos * (qts_frames_passados - 1),
                "media_momento": resultado_frame["media_atencao"],
                "total_focados": resultado_frame["focados"],
                "total_distraidos": resultado_frame["distraidos"]
            })

    media_final_video = round(sum(medias_temporais) / len(medias_temporais), 2) if medias_temporais else 0.0

    return {
        "status": "sucesso",
        "media_global_aula": media_final_video,
        "linha_do_tempo": linha_do_tempo
    } 
    





@app.post("/processar-video/")
async def processar_video(file: UploadFile = File(...)):

    if "foca_engine" not in model:
        raise HTTPException(status_code=503, detail="Modelo não inicializado.")

    if not file.content_type.startswith("video/"):
        print("2")
        raise HTTPException(status_code=400, detail="O arquivo enviado não é um vídeo válido.")

    file_path = os.path.join(UPLOAD_DIR, file.filename)
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    finally:
        file.file.close()

    try:
        req = VideoRequest(file_path)
        return model["foca_engine"].processar_video(req)
    except:
        raise HTTPException(status_code=400, detail="O arquivo enviado não é um vídeo válido.")
    

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)