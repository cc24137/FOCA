# ==========================================
# 1. MODELO YOLOv8 E DETECÇÃO
# ==========================================
YOLO_PATH = '../models/yolov8_nano_foca_v3_800_50/yolov8_nano_foca_v3_800_50e/weights/best.pt'
YOLO_CONFIDENCE = 0.30 # Ajustado com base no pico do gráfico F1-Score!

# ==========================================
# 2. LIMITES GEOMÉTRICOS E FACIAIS (AS NOVAS MÉTRICAS MACRO)
# ==========================================
# Proporção da Bounding Box (Largura / Altura)
PROPORCAO_MIN_PERFIL = 0.60  # Abaixo disso = Rosto de perfil (conversando para o lado)
PROPORCAO_MAX_DEITADO = 1.15 # Acima disso = Rosto achatado (deitado na mesa)

# Detecção de Boca Aberta (Bocejo ou Conversa)
ALTURA_MINIMA_ANALISE_BOCA = 60
LIMITE_BOCA_ABERTA = 0.65    # Acima disso = Área escura muito grande na região inferior do rosto

# ==========================================
# 3. PESOS E AVALIAÇÃO DE ATENÇÃO
# ==========================================
# Pesos Históricos (Zerados devido à limitação física da câmera escolar - Ver TCC Cap. X)
PESO_ABERTURA_OCULAR = 0.00
PESO_DIRECAO_OLHAR = 0.00

# Limiares de Decisão (De 0.0 a 1.0) - Serão usados quando reativarmos o cálculo
LIMIAR_FOCADO_BAIXA = 0.70
LIMIAR_PARCIAL_BAIXA = 0.45

# ZONAS EXTREMAS DE PERDA TOTAL DE FOCO
EXTREMO_PERFIL = 0.35   # Cabeça totalmente virada para trás/ombro
EXTREMO_DEITADO = 1.60  # Cabeça totalmente achatada na mesa

# INTERRUPTORES DE MÉTRICAS (Feature Flags para Estudo de Ablação)
USAR_METRICA_POSTURA = True  # Recomendado manter True, pois é a base
USAR_METRICA_BOCA = True
