import math
import cv2
import numpy as np
from ultralytics import YOLO
import os

import niko_config as cfg

class VideoRequest():
    caminho_video: str
    intervalo_segundos: int = 5

    def __init__(self, path):
        self.caminho_video = path

class NikoEngine:
    def __init__(self, yolo_path):
        print("[Niko Engine] A carregar modelo YOLOv8 ultraleve...")
        self.yolo = YOLO(yolo_path)

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

    def calcular_indice_final(self, proporcao, boca, modo_coletivo=False):
        """
        Calcula o índice final de atenção com base nas métricas.
        Utiliza Lógica Gradual (Soft Thresholding) para avaliar a postura de forma humana.
        """
        indice = 1.0 # Inicia com 100% de foco

        

        # 1. ANÁLISE DE POSTURA (Lógica Gradual)
        if not modo_coletivo:
            # CENÁRIO NORMAL: O foco é para a frente (0.60 a 1.15)
            if proporcao < cfg.PROPORCAO_MIN_PERFIL:
                # O aluno está virando o rosto. A nota cai de 1.0 a 0.0 conforme chega no EXTREMO_PERFIL.
                intervalo = cfg.PROPORCAO_MIN_PERFIL - cfg.EXTREMO_PERFIL
                distancia = cfg.PROPORCAO_MIN_PERFIL - proporcao
                indice = 1.0 - (distancia / intervalo)
                
            elif proporcao > cfg.PROPORCAO_MAX_DEITADO:
                # O aluno está abaixando a cabeça. A nota cai de 1.0 a 0.0 conforme chega no EXTREMO_DEITADO.
                intervalo = cfg.EXTREMO_DEITADO - cfg.PROPORCAO_MAX_DEITADO
                distancia = proporcao - cfg.PROPORCAO_MAX_DEITADO
                indice = 1.0 - (distancia / intervalo)
        else:
            # CENÁRIO COLETIVO: O foco da turma foi para o lado (< 0.60)
            if proporcao > cfg.PROPORCAO_MAX_DEITADO:
                # O aluno já virou para frente e abaixou a cabeça. Distração total!
                indice = 0.0 
                
            elif proporcao >= cfg.PROPORCAO_MIN_PERFIL:
                # O aluno está virando para a frente em vez de olhar pro lado com a turma.
                # A nota cai gradualmente de 1.0 (no 0.60) até 0.0 (no 1.15).
                intervalo = cfg.PROPORCAO_MAX_DEITADO - cfg.PROPORCAO_MIN_PERFIL
                distancia = proporcao - cfg.PROPORCAO_MIN_PERFIL
                indice = 1.0 - (distancia / intervalo)

        # Proteção matemática para garantir que o índice não passe de 1.0 nem fique negativo
        indice = max(0.0, min(indice, 1.0))

        # 2. ANÁLISE DA BOCA (Filtro Secundário)
        if cfg.USAR_METRICA_BOCA and boca > cfg.LIMITE_BOCA_ABERTA:
            indice -= 0.5 # Perde 50% do foco atual

        # Trava novamente após a penalidade da boca
        indice = max(0.0, min(indice, 1.0))

        # 3. DEFINIÇÃO DO STATUS E COR
        if indice >= cfg.LIMIAR_FOCADO_BAIXA:
            status = 'FOCADO'
            cor = (0, 255, 0) # Verde
        elif indice >= cfg.LIMIAR_PARCIAL_BAIXA:
            status = 'PARCIAL'
            cor = (0, 255, 255) # Amarelo 
        else:
            status = 'DISTRAIDO'
            cor = (0, 0, 255) # Vermelho
            
        return indice, status, cor

    def processar_frame(self, img):
        if img is None: return None

        resultados_yolo = self.yolo(img, conf=cfg.YOLO_CONFIDENCE, verbose=False)
        detalhes_alunos = []

        # =========================
        # ETAPA 1: COLETA DE DADOS
        # =========================
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

                # Métrica 1: Proporção (Postura)
                # Sempre calculada, pois só usa matemática básica das coordenadas
                # Dicionario proporções:
                    # validar depois com testes >_<
                    # < 0.60 = Rosto de perfil (conversando para o lado)
                    # 0.60 a 1.15 = Rosto normal (olhando para frente)
                    # > 1.15 = Rosto achatado (deitado na mesa)
                proporcao = largura / altura if altura > 0 else 1.0

                # Métrica 2: Boca (Apenas para rostos minimamente visíveis)
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
                    # Status, cor e índice serão preenchidos na etapa 3
                })

        # ==========================================
        # ETAPA 2: LEITURA DA LINHA DE BASE DA TURMA
        # ==========================================
        total = len(detalhes_alunos)
        modo_coletivo = False

        if total > 0:
            # Conta quantos alunos estão virados pro lado (perfil)
            alunos_virados = sum(1 for a in detalhes_alunos if a['proporcao'] < cfg.PROPORCAO_MIN_PERFIL)
            porcentagem_virados = alunos_virados / total

            # Se 60% ou mais da turma virou o rosto, ativa o evento coletivo
            if porcentagem_virados >= 0.60:
                modo_coletivo = True

        # ==========================================
        # ETAPA 3: JULGAMENTO FINAL
        # ==========================================
        focados = 0
        distraidos = 0
        soma_indices = 0.0

        for aluno in detalhes_alunos:
            # Envia as métricas e avisa a função se a sala está em evento coletivo ou não
            indice, status, cor = self.calcular_indice_final(aluno['proporcao'], aluno['boca'], modo_coletivo)

            aluno['indice'] = round(indice, 2)
            aluno['status'] = status
            aluno['cor'] = cor

            soma_indices += indice
            if status == 'FOCADO': focados += 1
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
