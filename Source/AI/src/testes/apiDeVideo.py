from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import uvicorn
import shutil
import os
from huggingface_hub import hf_hub_download
from niko_engine import NikoEngine, VideoRequest

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
        model["niko_engine"] = NikoEngine(model_path)
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

@app.post("/process-video/")
async def process_video(file: UploadFile = File(...)):
    
    if not file.content_type.startswith("video/"):
        raise HTTPException(status_code=400, detail="O arquivo enviado não é um vídeo válido.")

    file_path = os.path.join(UPLOAD_DIR, file.filename)

    # 2. Salva o arquivo no disco local em pedaços (streaming)
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    finally:
        file.file.close()  # Garante o fechamento do arquivo original

    # 3. AQUI entra a integração com seu modelo de Visao Computacional!
    # Exemplo: resultado = meu_modelo_ia.predict(file_path)
    
    return {
        "filename": file.filename,
        "status": "Vídeo recebido com sucesso",
        "saved_path": file_path,
        # "predictions": resultado
    }



@app.post("/processar-video/")
async def processar_video(file: UploadFile = File(...)):

    if "niko_engine" not in model:
        raise HTTPException(status_code=503, detail="Modelo não inicializado.")

    if not file.content_type.startswith("video/"):
        raise HTTPException(status_code=400, detail="O arquivo enviado não é um vídeo válido.")

    file_path = os.path.join(UPLOAD_DIR, file.filename)
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    finally:
        file.file.close()

    try:
        req = VideoRequest(file_path)
        return model["niko_engine"].processar_video(req)
    except:
        raise HTTPException(status_code=400, detail="O arquivo enviado não é um vídeo válido.")
    

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)