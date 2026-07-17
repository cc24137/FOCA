# ========================================================================
# caminhos e modelo YOLO
# ========================================================================
YOLO_PATH = 'models/yolov8_nano_foca_v3_800_50e/weights/best.pt'

# ========================================================================
# Parâmetros de detecção de rosto
# ========================================================================
YOLO_CONFIDENCE = 0.4          # Confiança mínima para detectar um rosto

# Limites de Proporção da Bounding Box (Largura / Altura)
# Um rosto frontal e atento costuma ter proporção entre 0.7 e 0.9.
PROPORCAO_MIN_PERFIL = 0.60  # Abaixo disso = Rosto de perfil (conversando para o lado)
PROPORCAO_MAX_DEITADO = 1.15 # Acima disso = Rosto achatado (deitado na mesa)

# ========================================================================
# Avaliação da análise
# =======================================================================

# Pesos na composição do Índice Final (A soma deve ser 1.0)
PESO_ABERTURA_OCULAR = 0.60
PESO_DIRECAO_OLHAR = 0.40

# Limiares de Decisão das Notas (De 0.0 a 1.0)
LIMIAR_FOCADO_BAIXA = 0.70
LIMIAR_PARCIAL_BAIXA = 0.45