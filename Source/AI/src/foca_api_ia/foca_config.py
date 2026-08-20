# ==========================================
# 1. MODELO YOLOv8 E DETECÇÃO
# ==========================================
YOLO_PATH = '../models/yolov8_nano_foca_v3_800_50e/weights/best.pt'
YOLO_CONFIDENCE = 0.30 # Ajustado com base no pico do gráfico F1-Score!

# ==========================================
# 2. LIMITES GEOMÉTRICOS E FACIAIS (AS NOVAS MÉTRICAS MACRO)
# ==========================================
# Proporção da Bounding Box (Largura / Altura)
PROPORCAO_MIN_PERFIL = 0.65  # Abaixo disso = Rosto de perfil (conversando para o lado)
PROPORCAO_MAX_DEITADO = 0.80 # Acima disso = Rosto achatado (deitado na mesa)

# Detecção de Boca Aberta (Bocejo ou Conversa)
ALTURA_MINIMA_ANALISE_BOCA = 60
LIMITE_BOCA_ABERTA = 0.20    # Acima disso = Área escura muito grande na região inferior do rosto

# ==========================================
# 3. PESOS E AVALIAÇÃO DE ATENÇÃO
# ==========================================
PESO_ABERTURA_OCULAR = 0.00
PESO_DIRECAO_OLHAR = 0.00

# Limiares de Decisão (De 0.0 a 1.0)
LIMIAR_FOCADO_BAIXA = 0.70
LIMIAR_PARCIAL_BAIXA = 0.45

# ZONAS EXTREMAS DE PERDA TOTAL DE FOCO
EXTREMO_PERFIL = 0.55   # Cabeça totalmente virada para trás/ombro
EXTREMO_DEITADO = 1.20  # Cabeça totalmente achatada na mesa

# INTERRUPTORES DE MÉTRICAS
USAR_METRICA_POSTURA = True
USAR_METRICA_BOCA = True
