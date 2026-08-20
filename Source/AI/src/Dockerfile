FROM python:3.10-slim

# Evita arquivos .pyc e garante logs em tempo real
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

# Instala dependências do sistema necessárias para o OpenCV
RUN apt-get update && apt-get install -y --no-install-recommends \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgl1 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Criar usuário não-root e definir diretório de trabalho único
RUN useradd -m -u 1000 user
USER user
ENV HOME=/home/user \
    PATH=/home/user/.local/bin:$PATH
WORKDIR $HOME/app

# Copiar o requirements.txt da pasta foca_api_ia antes do código para aproveitar o cache
COPY --chown=user foca_api_ia/requirements.txt ./requirements.txt

# Instala PyTorch CPU primeiro e depois o restante dos pacotes do requirements.txt
RUN pip install --no-cache-dir torch torchvision --index-url https://download.pytorch.org/whl/cpu && \
    pip install --no-cache-dir -r requirements.txt

# Copiar todo o restante do código da aplicação com a permissão do usuário
COPY --chown=user . .

# Expor a porta padrão
EXPOSE 7860

# Inicialização limpa com porta dinâmica ($PORT do Render ou 7860)
CMD ["sh", "-c", "uvicorn foca_api_ia.apiDeVideo:app --host 0.0.0.0 --port ${PORT:-7860}"]