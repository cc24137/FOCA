import math

import cv2
import mediapipe as mp
import numpy as np
from mediapipe.tasks import python
from mediapipe.tasks.python import vision
from ultralytics import YOLO

import niko_config as cfg


class NikoEngine:
    def __init__(self):
        print("[Niko Engine] A carregar modelos para a memória RAM")
        # usa os caminhos em niko_config
        self.yolo = YOLO(cfg.YOLO_PATH)

        base_options = python.BaseOptions(model_asset_path=cfg.MEDIAPIPE_PATH)
        options = vision.FaceLandmarkerOptions(
            base_options=base_options,
            output_face_blendshapes=False,
            output_facial_transformation_matrixes=True,
            num_faces=1
        )
        self.detector_mp = vision.FaceLandmarker.create_from_options(options)

        # Filtro CLAHE configurado globalmente
        self.clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(4, 4))
        print("[Niko Engine] Motor inicializado e pronto para análises.")

    def extrair_angulos_mediapipe(self, matriz_transformacao):
        r13 = matriz_transformacao[0][2]
        r23 = matriz_transformacao[1][2]
        r33 = matriz_transformacao[2][2]
        pitch = math.atan2(-r23, r33)
        yaw = math.atan2(r13, math.sqrt(r23**2 + r33**2))
        return int(math.degrees(yaw)), int(math.degrees(pitch))

    def avaliar_alta_resolucao(self, yaw, pitch, mediana_yaw, mediana_pitch):
        # Exceção: Aluno anotando no caderno (olhando para baixo, mas com a cabeça reta para a frente)
        if pitch > cfg.PITCH_ANOTANDO and abs(yaw) < cfg.YAW_ANOTANDO:
            return cfg.ATENCAO_ANOTANDO, "ANOTANDO", (255, 255, 0) # Ciano

        # Calcula a distância Euclidiana 2D até à mediana da turma
        distancia = math.sqrt((yaw - mediana_yaw)**2 + (pitch - mediana_pitch)**2)

        # Normaliza o índice com base na DISTANCIA_ANGULAR_MAXIMA
        indice = max(0.0, 1.0 - (distancia / cfg.DISTANCIA_ANGULAR_MAXIMA))

        if indice >= cfg.LIMIAR_FOCADO_ALTA:
            return round(indice, 2), "FOCADO", (0, 255, 0) # Verde
        elif indice >= cfg.LIMIAR_PARCIAL_ALTA:
            return round(indice, 2), "PARCIAL", (0, 165, 255) # Laranja
        else:
            return round(indice, 2), "DISTRAIDO", (0, 0, 255) # Vermelho

    def extrair_abertura_ocular(self, imagem_clahe):
        try:
            h = imagem_clahe.shape[0]
            regiao_olhos = imagem_clahe[:int(h * 0.35), :]
            _, thresh = cv2.threshold(regiao_olhos, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
            pixels_escuros = cv2.countNonZero(thresh)
            total_pixels = regiao_olhos.shape[0] * regiao_olhos.shape[1]
            razao = pixels_escuros / total_pixels if total_pixels > 0 else 0.5
            return min(razao * 2, 1.0)
        except:
            return 0.5

    def extrair_direcao_olhar(self, imagem_clahe):
        try:
            regiao_olhos = imagem_clahe[:int(imagem_clahe.shape[0] * 0.4), :]
            _, thresh = cv2.threshold(regiao_olhos, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
            contornos, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            if not contornos:
                return 0.5
            maior_contorno = max(contornos, key=cv2.contourArea)
            M = cv2.moments(maior_contorno)
            if M["m00"] == 0: return 0.5
            cx = int(M["m10"] / M["m00"])
            x_norm = cx / regiao_olhos.shape[1]
            return max(0.0, 1.0 - abs(x_norm - 0.5) * 2.5)
        except:
            return 0.5

    def avaliar_baixa_resolucao(self, abertura_ocular, direcao_olhar):
        indice = (abertura_ocular * cfg.PESO_ABERTURA_OCULAR) + (direcao_olhar * cfg.PESO_DIRECAO_OLHAR)

        if indice >= cfg.LIMIAR_FOCADO_BAIXA:
            return round(indice, 2), "FOCADO(LowRes)", (0, 200, 0)
        elif indice >= cfg.LIMIAR_PARCIAL_BAIXA:
            return round(indice, 2), "PARCIAL(LowRes)", (0, 120, 255)
        else:
            return round(indice, 2), "DISTR(LowRes)", (0, 0, 200)

    def processar_frame(self, img):
        if img is None: return None

        resultados_yolo = self.yolo(img, conf=cfg.YOLO_CONFIDENCE, verbose=False)
        alunos_alta_res, alunos_baixa_res = [], []

        for resultado in resultados_yolo:
            for caixa in resultado.boxes:
                x1, y1, x2, y2 = map(int, caixa.xyxy[0])
                altura_rosto = y2 - y1

                # Aplica o padding percentual
                m_x = int((x2 - x1) * cfg.PADDING_ROSTO_PERCENT)
                m_y = int(altura_rosto * cfg.PADDING_ROSTO_PERCENT)

                x1_p, y1_p = max(0, x1 - m_x), max(0, y1 - m_y)
                x2_p, y2_p = min(img.shape[1], x2 + m_x), min(img.shape[0], y2 + m_y)

                recorte = img[y1_p:y2_p, x1_p:x2_p]
                if recorte.size == 0:
                    continue

                # decisão com a resolução do rosto detectado
                if altura_rosto >= cfg.LIMITE_RESOLUCAO_ALTURA:
                    recorte_rgb = recorte[..., ::-1] # conversão otimizada
                    imagem_mp = mp.Image(image_format=mp.ImageFormat.SRGB, data=recorte_rgb)
                    res_mp = self.detector_mp.detect(imagem_mp)

                    if res_mp.facial_transformation_matrixes:
                        matriz = res_mp.facial_transformation_matrixes[0]
                        yaw, pitch = self.extrair_angulos_mediapipe(matriz)
                        
                        alunos_alta_res.append({'bbox': (x1, y1, x2, y2), 'yaw': yaw, 'pitch': pitch})
                else:
                    gray = cv2.cvtColor(recorte, cv2.COLOR_BGR2GRAY)
                    imagem_clahe = self.clahe.apply(gray) # CLAHE calculado apenas uma vez por eficiência

                    abertura = self.extrair_abertura_ocular(imagem_clahe)
                    direcao = self.extrair_direcao_olhar(imagem_clahe)
                    alunos_baixa_res.append({'bbox': (x1, y1, x2, y2), 'abertura': abertura, 'direcao': direcao})

        indices_gerais = []
        qtd_focados = 0
        qtd_distraidos = 0

        mediana_yaw = np.median([a['yaw'] for a in alunos_alta_res]) if alunos_alta_res else 0
        mediana_pitch = np.median([a['pitch'] for a in alunos_alta_res]) if alunos_alta_res else 0

        # Mediana com clamping para evitar que a turma toda puxe a média caso se distraiam juntos
        mediana_yaw = max(-cfg.LIMITE_YAW_MEDIANA, min(cfg.LIMITE_YAW_MEDIANA, mediana_yaw))
        mediana_pitch = max(-cfg.LIMITE_PITCH_MEDIANA, min(cfg.LIMITE_PITCH_MEDIANA, mediana_pitch))

        # Avaliação final combinada
        for a in alunos_alta_res:
            ind, status, _ = self.avaliar_alta_resolucao(a['yaw'], a['pitch'], mediana_yaw, mediana_pitch)
            indices_gerais.append(ind)
            if status in ["FOCADO", "ANOTANDO"]: qtd_focados += 1
            elif status == "DISTRAIDO": qtd_distraidos += 1

        for a in alunos_baixa_res:
            ind, status, _ = self.avaliar_baixa_resolucao(a['abertura'], a['direcao'])
            indices_gerais.append(ind)
            if status == "FOCADO(LowRes)": qtd_focados += 1
            elif status == "DISTR(LowRes)": qtd_distraidos += 1

        media_turma = round(np.mean(indices_gerais), 2) if indices_gerais else 0.0

        return {
            "media_atencao": media_turma,
            "total_alunos": len(indices_gerais),
            "focados": qtd_focados,
            "distraidos": qtd_distraidos
        }
