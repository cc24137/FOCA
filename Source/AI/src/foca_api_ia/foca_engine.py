import math
import cv2
import numpy as np
from ultralytics import YOLO
import os

import foca_config as cfg

class VideoRequest():
    caminho_video: str
    intervalo_segundos: int = 5

    def __init__(self, path):
        self.caminho_video = path

class FocaEngine:
    def __init__(self, yolo_path):
        print("[Foca Engine] A carregar modelo YOLOv8 ultraleve...")
        self.yolo = YOLO(yolo_path)

        # Filtro CLAHE configurado globalmente
        self.clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(4, 4))
        print("[Foca Engine] Motor inicializado.")

    def extrair_estado_boca(self, imagem_clahe):
        """
        Analisa estritamente a região dos lábios utilizando limiar absoluto de escuridão.
        Evita falsos positivos de Otsu em bocas fechadas.
        """
        try:
            h, w = imagem_clahe.shape[:2]

            # recorte da boca
            # Y: de 62% a 82% (remove queixo, pescoço e nariz)
            # X: de 25% a 75% (remove sombras de bochechas e fundo)
            y1, y2 = int(h * 0.62), int(h * 0.82)
            x1, x2 = int(w * 0.25), int(w * 0.75)
            regiao_boca = imagem_clahe[y1:y2, x1:x2]

            if regiao_boca.size == 0:
                return 0.0

            # limiar de escuridao
            # apenas a cavidade interna da boca aberta atinge valores de cinza < 50
            _, thresh = cv2.threshold(regiao_boca, 50, 255, cv2.THRESH_BINARY_INV)

            # contagem d epixels
            pixels_cavidade = cv2.countNonZero(thresh)
            total_pixels = regiao_boca.size

            razao = pixels_cavidade / total_pixels if total_pixels > 0 else 0.0

            #normalizacao -> multiplica por 3.5 para mapear a abertura real na escala 0.0 a 1.0
            return min(razao * 3.5, 1.0)
        except:
            return 0.0

    def calcular_indice_final(self, proporcao, boca, modo_coletivo=False):
        """
        Calcula o índice final de atenção com dupla rampa gradual:
        - Dentro da zona atenta [0.65, 0.80]: varia de 1.0 (centro) até 0.8 (bordas).
        - Fora da zona atenta: varia de 0.8 (limiar) até 0.0 (extremo).
        """
        indice = 1.0

        # centro exato da faixa de foco ideal
        p_centro = (cfg.PROPORCAO_MIN_PERFIL + cfg.PROPORCAO_MAX_DEITADO) / 2.0

        # análise gradual de postura (proporção)
        if not modo_coletivo:
            if cfg.PROPORCAO_MIN_PERFIL <= proporcao <= cfg.PROPORCAO_MAX_DEITADO:
                # dentro do limiar -> Variação de 1.0 (no centro) até 0.8 (nas bordas)
                if proporcao <= p_centro:
                    intervalo = p_centro - cfg.PROPORCAO_MIN_PERFIL
                    distancia = p_centro - proporcao
                    indice = 1.0 - 0.2 * (distancia / intervalo) if intervalo > 0 else 1.0
                else:
                    intervalo = cfg.PROPORCAO_MAX_DEITADO - p_centro
                    distancia = proporcao - p_centro
                    indice = 1.0 - 0.2 * (distancia / intervalo) if intervalo > 0 else 1.0

            elif proporcao < cfg.PROPORCAO_MIN_PERFIL:
                # fora do limiar (perfil) -> de 0.8 a 0.0
                intervalo = cfg.PROPORCAO_MIN_PERFIL - cfg.EXTREMO_PERFIL
                distancia = proporcao - cfg.EXTREMO_PERFIL
                indice = 0.8 * (distancia / intervalo) if intervalo > 0 else 0.0

            else:  # proporcao > cfg.PROPORCAO_MAX_DEITADO
                # fora do limiar (deitado) ->  0.8 a 0.0
                intervalo = cfg.EXTREMO_DEITADO - cfg.PROPORCAO_MAX_DEITADO
                distancia = cfg.EXTREMO_DEITADO - proporcao
                indice = 0.8 * (distancia / intervalo) if intervalo > 0 else 0.0

        else:
            # cenário coletivo -> Foco da turma está para o lado
            if proporcao < cfg.PROPORCAO_MIN_PERFIL:
                indice = 1.0
            elif proporcao > cfg.PROPORCAO_MAX_DEITADO:
                indice = 0.0
            else:
                intervalo = cfg.PROPORCAO_MAX_DEITADO - cfg.PROPORCAO_MIN_PERFIL
                distancia = proporcao - cfg.PROPORCAO_MIN_PERFIL
                indice = 0.8 * (1.0 - (distancia / intervalo)) if intervalo > 0 else 0.0

        indice = max(0.0, min(indice, 1.0))

        # ánálise gradual da boca (Filtro Secundário)
        if cfg.USAR_METRICA_BOCA and boca > cfg.LIMITE_BOCA_ABERTA:
            fator_abertura = (boca - cfg.LIMITE_BOCA_ABERTA) / (1.0 - cfg.LIMITE_BOCA_ABERTA + 1e-6)
            penalidade_boca = min(fator_abertura, 1.0) * 0.5
            indice -= penalidade_boca

        indice = max(0.0, min(indice, 1.0))

        # status e cor
        if indice >= cfg.LIMIAR_FOCADO_BAIXA:
            status = 'FOCADO'
            cor = (0, 255, 0)
        elif indice >= cfg.LIMIAR_PARCIAL_BAIXA:
            status = 'PARCIAL'
            cor = (0, 255, 255)
        else:
            status = 'DISTRAIDO'
            cor = (0, 0, 255)

        return indice, status, cor

    def processar_frame(self, img):
        if img is None: return None

        resultados_yolo = self.yolo(img, conf=cfg.YOLO_CONFIDENCE, verbose=False)
        detalhes_alunos = []

        # dados do yolo
        for resultado in resultados_yolo:
            for caixa in resultado.boxes:
                x1, y1, x2, y2 = map(int, caixa.xyxy[0])

                x1, y1 = max(0, x1), max(0, y1)
                x2, y2 = min(img.shape[1], x2), min(img.shape[0], y2)

                largura = x2 - x1
                altura = y2 - y1
                recorte = img[y1:y2, x1:x2]

                if recorte.size == 0:
                    continue

                proporcao = largura / altura if altura > 0 else 1.0

                if altura < cfg.ALTURA_MINIMA_ANALISE_BOCA:
                    boca = 0.0
                else:
                    gray = cv2.cvtColor(recorte, cv2.COLOR_BGR2GRAY)
                    imagem_clahe = self.clahe.apply(gray)
                    boca = self.extrair_estado_boca(imagem_clahe) if cfg.USAR_METRICA_BOCA else 0.0

                detalhes_alunos.append({
                    'bbox': (x1, y1, x2, y2),
                    'tipo': 'UNIFICADO',
                    'boca': round(boca, 2),
                    'proporcao': round(proporcao, 2)
                })

        # le linha de base da turma
        total = len(detalhes_alunos)
        modo_coletivo = False

        # não utiliza o modo coletivo para imagens com pouqíssimas pessoas
        if total >= 3:
            alunos_virados = sum(1 for a in detalhes_alunos if a['proporcao'] < cfg.PROPORCAO_MIN_PERFIL)
            porcentagem_virados = alunos_virados / total

            if porcentagem_virados >= 0.60:
                modo_coletivo = True

        # avaliação final
        focados = 0
        distraidos = 0
        soma_indices = 0.0

        for aluno in detalhes_alunos:
            indice, status, cor = self.calcular_indice_final(aluno['proporcao'], aluno['boca'], modo_coletivo)

            aluno['indice'] = round(indice, 2)
            aluno['status'] = status
            aluno['cor'] = cor

            soma_indices += indice
            if status == 'FOCADO': focados += 1
            if status == 'PARCIAL': distraidos += 0.5
            if status == 'DISTRAIDO': distraidos += 1

        media_turma = round(soma_indices / total, 2) if total > 0 else 0.0

        return {
            "media_atencao": media_turma,
            "total_alunos": total,
            "focados": focados,
            "distraidos": distraidos,
            "detalhes_alunos": detalhes_alunos
        }

    def processar_video(self, video: VideoRequest):
        eh_url = video.caminho_video.startswith("http://") or video.caminho_video.startswith("https://")

        if not eh_url and not os.path.exists(video.caminho_video):
            raise Exception(status_code=404, detail="Arquivo/URL de vídeo não encontrado.")

        cap = cv2.VideoCapture(video.caminho_video)
        fps = cap.get(cv2.CAP_PROP_FPS)

        if fps <= 0:
            fps = 30

        frames_para_pular = int(fps * video.intervalo_segundos)

        medias_temporais = []
        linha_do_tempo = []
        contador_frames = 0

        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break

            # Processa apenas o frame exato do intervalo
            if contador_frames % frames_para_pular == 0:
                resultado_frame = self.processar_frame(frame)

                if resultado_frame and resultado_frame["total_alunos"] > 0:
                    medias_temporais.append(resultado_frame["media_atencao"])

                    # Monta a estrutura detalhada para os diferentes frames analisados -> usar pro gráfico da web dps
                    segundo_atual = int(contador_frames / fps)
                    linha_do_tempo.append({
                        "segundo_video": segundo_atual,
                        "media_momento": resultado_frame["media_atencao"],
                        "total_focados": resultado_frame["focados"],
                        "total_distraidos": resultado_frame["distraidos"]
                    })

            contador_frames += 1

        cap.release()

        # Calcula a média geral do vídeo inteiro
        media_final_video = round(sum(medias_temporais) / len(medias_temporais), 2) if medias_temporais else 0.0

        return {
            "status": "sucesso",
            "video_processado": video.caminho_video,
            "media_global_aula": media_final_video,
            "linha_do_tempo": linha_do_tempo
        }
