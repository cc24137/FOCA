import math

import cv2
import numpy as np
from ultralytics import YOLO

import niko_config as cfg

class NikoEngine:
    def __init__(self):
        print("[Niko Engine] A carregar modelo YOLOv8 ultraleve...")
        self.yolo = YOLO(cfg.YOLO_PATH)

        # Filtro CLAHE configurado globalmente
        self.clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(4, 4))
        print("[Niko Engine] Motor inicializado. (Modo: Coleta de Métricas)")

    def extrair_abertura_ocular(self, imagem_clahe):
        try:
            h = imagem_clahe.shape[0]
            regiao_olhos = imagem_clahe[:int(h * 0.45), :]
            _, thresh = cv2.threshold(regiao_olhos, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
            pixels_escuros = cv2.countNonZero(thresh)
            total_pixels = regiao_olhos.shape[0] * regiao_olhos.shape[1]
            razao = pixels_escuros / total_pixels if total_pixels > 0 else 0.5
            return min(razao * 2, 1.0)
        except:
            return 0.5

    def extrair_direcao_olhar(self, imagem_clahe):
        try:
            regiao_olhos = imagem_clahe[:int(imagem_clahe.shape[0] * 0.45), :]
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

    def calcular_indice_final(self, abertura, direcao):
        # implementar depois
        return NotImplementedError("Método calcular_indice_final ainda não implementado.")

    def processar_frame(self, img):
        if img is None: return None

        resultados_yolo = self.yolo(img, conf=cfg.YOLO_CONFIDENCE, verbose=False)
        detalhes_alunos = []

        for resultado in resultados_yolo:
            for caixa in resultado.boxes:
                x1, y1, x2, y2 = map(int, caixa.xyxy[0])

                # Garantir que as coordenadas não ultrapassem os limites da imagem
                x1, y1 = max(0, x1), max(0, y1)
                x2, y2 = min(img.shape[1], x2), min(img.shape[0], y2)

                largura = x2 - x1
                altura = y2 - y1

                # Métrica 1: Proporção (Postura)
                proporcao = largura / altura if altura > 0 else 1.0

                # Recorte exato da Bounding Box
                recorte = img[y1:y2, x1:x2]

                if recorte.size == 0:
                    continue

                gray = cv2.cvtColor(recorte, cv2.COLOR_BGR2GRAY)
                imagem_clahe = self.clahe.apply(gray)

                # Métricas 2 e 3: Abertura e Direção (Olhos)
                abertura = self.extrair_abertura_ocular(imagem_clahe)
                direcao = self.extrair_direcao_olhar(imagem_clahe)

                indice_final = 0.0  # Placeholder
                #indice_final = self.calcular_indice_final(abertura, direcao)

                # salva os detalhes para teste
                detalhes_alunos.append({
                    'bbox': (x1, y1, x2, y2),
                    'tipo': 'UNIFICADO',
                    'indice': indice_final,
                    'status': 'ANALISE',
                    'cor': (255, 255, 0),     # Ciano para a caixa
                    'abertura': abertura,
                    'direcao': direcao,
                    'proporcao': round(proporcao, 2)
                })

        return {
            "media_atencao": 0.0,
            "total_alunos": len(detalhes_alunos),
            "focados": 0,
            "distraidos": 0,
            "detalhes_alunos": detalhes_alunos
        }
