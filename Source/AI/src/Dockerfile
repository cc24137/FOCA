FROM python:3.10-slim

# Evita que o Python gere arquivos .pyc e garante logs em tempo real
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

# Instala dependências do sistema necessárias para OpenCV e utilitários básicos
RUN apt-get update && apt-get install -y --no-install-recommends \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgl1 \
    curl \
    && rm -rf /var/lib/apt-get/lists/*

WORKDIR /app

# Copia e instala as dependências Python
COPY requirements.txt .

# Instala PyTorch CPU explicitamente primeiro para otimizar o cache de camadas do Docker
RUN pip install --no-cache-dir torch torchvision --index-url https://download.pytorch.org/whl/cpu
RUN pip install --no-cache-dir -r requirements.txt

# Copia o código da aplicação
COPY . .

# Configurações de usuário não-root (requisito do Hugging Face Spaces para segurança)
RUN useradd -m -u 1000 user
USER user
ENV HOME=/home/user \
    PATH=/home/user/.local/bin:$PATH

WORKDIR $HOME/app
COPY --chown=user . $HOME/app

# Porta padrão de escuta (7860 é a padrão do HF Spaces)
EXPOSE 7860

# Inicialização com a variável PORT dinâmica
CMD uvicorn testes.apiDeVideo:app --host 0.0.0.0 --port ${PORT:-7860}