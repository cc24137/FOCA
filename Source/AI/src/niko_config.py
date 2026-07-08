# ========================================================================
# caminhos dos modelos
# ========================================================================
YOLO_PATH = 'models/yolov8_nano_foca_v3_800_50e/weights/best.pt'
MEDIAPIPE_PATH = 'models/face_landmarker.task'

# ========================================================================
# Parâmetros de detecção de rosto
# ========================================================================
YOLO_CONFIDENCE = 0.4          # Confiança mínima para detectar um rosto
PADDING_ROSTO_PERCENT = 0.20   # Margem de segurança (20%) expandida ao redor do rosto

# ========================================================================
# Roteamento Dinâmico
# ========================================================================
LIMITE_RESOLUCAO_ALTURA = 80   # Rostos com altura >= 80px vão para ALTA RES. Menores vão para BAIXA RES.

# ========================================================================
# Parâmetros e pesos: alta resolução (frente da sala)
# ========================================================================
# Valores anotando no caderno
# if pitch > 20 and abs(yaw) < 40
PITCH_ANOTANDO = 20
YAW_ANOTANDO = 40
ATENCAO_ANOTANDO = 0.90

# Trava (Clamping) da Mediana - Impede que a turma toda puxe a métrica se estiverem distraídos
LIMITE_YAW_MEDIANA = 30
LIMITE_PITCH_MEDIANA = 20

# Limiar de conversa (Mouth Aspect Ratio)
LIMIAR_MAR_CONVERSA = 0.15     # Se a proporção da boca passar disso, o aluno está falando

# Distância angular máxima considerada antes do índice de atenção chegar a zero
DISTANCIA_ANGULAR_MAXIMA = 45.0

# Limiares para classificação do estado do aluno
LIMIAR_FOCADO_ALTA = 0.80
LIMIAR_PARCIAL_ALTA = 0.50

# ========================================================================
# Parâmetros e pesos: Baixa resolução (fundo da sala)
# ========================================================================
# Pesos do cálculo do índice (Abertura Ocular + Direção do Olhar). A soma deve ser 1.0
PESO_ABERTURA_OCULAR = 0.60
PESO_DIRECAO_OLHAR = 0.40

# Limiares para classificação do estado do aluno no fundo da sala
LIMIAR_FOCADO_BAIXA = 0.70
LIMIAR_PARCIAL_BAIXA = 0.45
