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

    def extrair_estado_boca(self, imagem_clahe):
        """
        Analisa os 35% inferiores do rosto.
        Retorna um valor de 0.0 a 1.0 representando a proporção de área escura.
        Valores altos indicam boca aberta (bocejo/conversa).
        """
        try:
            h = imagem_clahe.shape[0]
            # Recorta a região do queixo/boca
            regiao_boca = imagem_clahe[int(h * 0.65):, :]

            # Binariza a imagem
            _, thresh = cv2.threshold(regiao_boca, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)

            # Conta a área escura gerada pela cavidade da boca aberta
            pixels_claros = cv2.countNonZero(thresh)
            total_pixels = regiao_boca.shape[0] * regiao_boca.shape[1]
            pixels_escuros = total_pixels - pixels_claros

            razao = pixels_escuros / total_pixels if total_pixels > 0 else 0.0
            return min(razao * 2, 1.0) # Multiplica por 2 para normalizar a escala visualmente
        except:
            return 0.0

    def calcular_indice_final(self, proporcao, boca):
        """
        Calcula o índice final de atenção com base nas métricas disponíveis.
        """
        
        

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

                # Recorte exato da Bounding Box
                recorte = img[y1:y2, x1:x2]

                if recorte.size == 0:
                    continue

                # Métrica 1: Proporção (Postura)
                # Sempre calculada, pois só usa matemática básica das coordenadas
                # Dicionario proporções:
                    # validar depois com testes >_<
                    # < 0.60 = Rosto de perfil (conversando para o lado)
                    # 0.60 a 1.15 = Rosto normal (olhando para frente)
                    # > 1.15 = Rosto achatado (deitado na mesa)
                proporcao = largura / altura if altura > 0 else 1.0

                if recorte.size == 0:
                    continue

                gray = cv2.cvtColor(recorte, cv2.COLOR_BGR2GRAY)
                imagem_clahe = self.clahe.apply(gray)

                # Métrica 2: Estado da Boca
                if cfg.USAR_METRICA_BOCA:
                    boca = self.extrair_estado_boca(imagem_clahe)
                else:
                    boca = 0.0

                # -----------------------------------

                indice_final = 0.0  # Placeholder
                #indice_final = self.calcular_indice_final(proporcao, boca)

                # salva os detalhes para teste
                detalhes_alunos.append({
                    'bbox': (x1, y1, x2, y2),
                    'tipo': 'UNIFICADO',
                    'indice': indice_final,
                    'status': 'ANALISE',
                    'cor': (255, 255, 0),     # Ciano para a caixa
                    'boca': round(boca, 2),
                    'proporcao': round(proporcao, 2)
                })

        return {
            "media_atencao": 0.0,
            "total_alunos": len(detalhes_alunos),
            "focados": 0,
            "distraidos": 0,
            "detalhes_alunos": detalhes_alunos
        }
