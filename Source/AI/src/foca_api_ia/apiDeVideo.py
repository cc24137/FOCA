from fastapi import FastAPI, UploadFile, File, HTTPException, Form, Request
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from starlette.concurrency import run_in_threadpool
import asyncio
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

SECOND_REPO_ID = "rafafazion/foca-yolov8-small"
SECOND_FILENAME = "best.pt"

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

        second_model_path = hf_hub_download(
            repo_id=SECOND_REPO_ID,
            filename=SECOND_FILENAME
        )
        print("Segundo modelo (small) encontrado.")
        model["foca_engine_small"] = FocaEngine(second_model_path)
        print("Segundo modelo (small) carregado na memória.")

    except Exception as e:
        print(f"ERRO: Falha crítica ao carregar o modelo: {e}")
        raise e

    yield

    model.clear()
    print("Modelos liberados")

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

live_engine_lock = asyncio.Lock()
MAX_FRAME_BYTES = 8 * 1024 * 1024

@app.post('/processar-frame-tempo-real/')
async def processar_frame_tempo_real(request: Request, usar_modelo_melhor: bool = False):
    engine = None
    if usar_modelo_melhor:
        print("Analisa frame com engine small")
        engine = model.get('foca_engine_small')
    else:
        print("Analisa frame com engine nano")
        engine = model.get('foca_engine')

    if engine is None:
        raise HTTPException(status_code=503, detail='Modelo não inicializado.')
    if request.headers.get('content-type', '').split(';')[0] != 'image/jpeg':
        raise HTTPException(status_code=415, detail='Envie um corpo JPEG.')

    # Corpo cru, limitado e recebido em memória: sem UploadFile/SpooledTemporaryFile.
    contents = bytearray()
    img = None
    nparr = None
    try:
        async for chunk in request.stream():
            if len(contents) + len(chunk) > MAX_FRAME_BYTES:
                raise HTTPException(status_code=413, detail='Imagem acima de 8 MiB.')
            contents.extend(chunk)
        if not contents:
            raise HTTPException(status_code=400, detail='Imagem vazia.')
        nparr = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img is None:
            raise HTTPException(status_code=400, detail='Imagem inválida.')
        # Evita alocações excessivas no processamento de imagens grandes.
        if img.shape[0] * img.shape[1] > 16_000_000:
            raise HTTPException(status_code=413, detail='Resolução acima do limite de 16 megapixels.')
        async with live_engine_lock:
            resultado = await run_in_threadpool(engine.processar_frame, img)
        linha = []
        if resultado and resultado['total_alunos'] > 0:
            linha.append({
                'segundo_video': 0,
                'media_momento': resultado['media_atencao'],
                'total_focados': resultado['focados'],
                'total_distraidos': resultado['distraidos'],
            })
        return {
            'status': 'sucesso',
            'media_global_aula': linha[0]['media_momento'] if linha else 0.0,
            'linha_do_tempo': linha,
        }
    finally:
        img = None
        nparr = None
        contents.clear()

# Diretório para salvar os vídeos temporariamente antes de passar pra IA
UPLOAD_DIR = "uploaded_videos"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@app.post("/processar-frames/")
async def processar_frames(usar_modelo_melhor: bool = Form(False), intervalo_segundos: int = Form(...), frames: List[UploadFile] = File(...)):
    if "foca_engine" not in model or "foca_engine_small" not in model:
        raise HTTPException(status_code=503, detail="Modelo não inicializado.")
    if not frames:
        raise HTTPException(status_code=400, detail="Frames não recebidos.")

    print(f"usar_modelo_melhor = {usar_modelo_melhor}")

    medias_temporais = []
    linha_do_tempo = []
    qts_frames_passados = 0

    for index, file in enumerate(frames):
        qts_frames_passados += 1
        contents = await file.read()

        nparr = np.frombuffer(contents, np.uint8)
        img_opencv = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if not usar_modelo_melhor:
            resultado_frame = model["foca_engine"].processar_frame(img_opencv)
            print("Frame processado com modelo nano")
        else:
            resultado_frame = model["foca_engine_small"].processar_frame(img_opencv)
            print("Frame processado com modelo small")


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