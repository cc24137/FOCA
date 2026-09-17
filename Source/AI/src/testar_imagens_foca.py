from pathlib import Path
import argparse
import csv
import json

import cv2
from ultralytics import YOLO


# ============================================================
# CONFIGURACAO DO TESTE
# Valores copiados do foca_config.py usado atualmente pela API.
# ============================================================
YOLO_CONFIDENCE = 0.30

PROPORCAO_MIN_PERFIL = 0.65
PROPORCAO_MAX_DEITADO = 0.80

ALTURA_MINIMA_ANALISE_BOCA = 60
LIMITE_BOCA_ABERTA = 0.20

LIMIAR_FOCADO_BAIXA = 0.70
LIMIAR_PARCIAL_BAIXA = 0.45

EXTREMO_PERFIL = 0.55
EXTREMO_DEITADO = 1.20

USAR_METRICA_POSTURA = True
USAR_METRICA_BOCA = False

EXTENSOES_IMAGEM = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}


class TestadorFoca:
    def __init__(self, caminho_modelo: str):
        print(f"[FOCA Teste] Carregando YOLO: {caminho_modelo}")
        self.yolo = YOLO(caminho_modelo)
        self.clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(4, 4))

    def extrair_estado_boca(self, imagem_clahe):
        """Replica a metrica de boca usada atualmente no FocaEngine."""
        try:
            h, w = imagem_clahe.shape[:2]

            y1, y2 = int(h * 0.62), int(h * 0.82)
            x1, x2 = int(w * 0.25), int(w * 0.75)
            regiao_boca = imagem_clahe[y1:y2, x1:x2]

            if regiao_boca.size == 0:
                return 0.0

            _, thresh = cv2.threshold(
                regiao_boca,
                50,
                255,
                cv2.THRESH_BINARY_INV,
            )

            pixels_cavidade = cv2.countNonZero(thresh)
            total_pixels = regiao_boca.size
            razao = pixels_cavidade / total_pixels if total_pixels > 0 else 0.0

            return min(razao * 3.5, 1.0)
        except Exception:
            return 0.0

    def calcular_indice_final(self, proporcao, boca, modo_coletivo=False):
        """Replica a funcao calcular_indice_final() usada atualmente na API."""
        indice = 1.0
        p_centro = (PROPORCAO_MIN_PERFIL + PROPORCAO_MAX_DEITADO) / 2.0

        if not modo_coletivo:
            if PROPORCAO_MIN_PERFIL <= proporcao <= PROPORCAO_MAX_DEITADO:
                if proporcao <= p_centro:
                    intervalo = p_centro - PROPORCAO_MIN_PERFIL
                    distancia = p_centro - proporcao
                    indice = (
                        1.0 - 0.2 * (distancia / intervalo)
                        if intervalo > 0
                        else 1.0
                    )
                else:
                    intervalo = PROPORCAO_MAX_DEITADO - p_centro
                    distancia = proporcao - p_centro
                    indice = (
                        1.0 - 0.2 * (distancia / intervalo)
                        if intervalo > 0
                        else 1.0
                    )

            elif proporcao < PROPORCAO_MIN_PERFIL:
                intervalo = PROPORCAO_MIN_PERFIL - EXTREMO_PERFIL
                distancia = proporcao - EXTREMO_PERFIL
                indice = (
                    0.8 * (distancia / intervalo)
                    if intervalo > 0
                    else 0.0
                )

            else:
                intervalo = EXTREMO_DEITADO - PROPORCAO_MAX_DEITADO
                distancia = EXTREMO_DEITADO - proporcao
                indice = (
                    0.8 * (distancia / intervalo)
                    if intervalo > 0
                    else 0.0
                )

        else:
            if proporcao < PROPORCAO_MIN_PERFIL:
                indice = 1.0
            elif proporcao > PROPORCAO_MAX_DEITADO:
                indice = 0.0
            else:
                intervalo = PROPORCAO_MAX_DEITADO - PROPORCAO_MIN_PERFIL
                distancia = proporcao - PROPORCAO_MIN_PERFIL
                indice = (
                    0.8 * (1.0 - (distancia / intervalo))
                    if intervalo > 0
                    else 0.0
                )

        indice = max(0.0, min(indice, 1.0))

        if USAR_METRICA_BOCA and boca > LIMITE_BOCA_ABERTA:
            fator_abertura = (boca - LIMITE_BOCA_ABERTA) / (
                1.0 - LIMITE_BOCA_ABERTA + 1e-6
            )
            penalidade_boca = min(fator_abertura, 1.0) * 0.5
            indice -= penalidade_boca

        indice = max(0.0, min(indice, 1.0))

        if indice >= LIMIAR_FOCADO_BAIXA:
            status = "FOCADO"
            cor = (0, 255, 0)
        elif indice >= LIMIAR_PARCIAL_BAIXA:
            status = "PARCIAL"
            cor = (0, 255, 255)
        else:
            status = "DISTRAIDO"
            cor = (0, 0, 255)

        return indice, status, cor

    def processar_imagem(self, imagem):
        resultados_yolo = self.yolo(
            imagem,
            conf=YOLO_CONFIDENCE,
            verbose=False,
        )

        detalhes_alunos = []

        for resultado in resultados_yolo:
            for caixa in resultado.boxes:
                x1, y1, x2, y2 = map(int, caixa.xyxy[0].tolist())

                x1, y1 = max(0, x1), max(0, y1)
                x2 = min(imagem.shape[1], x2)
                y2 = min(imagem.shape[0], y2)

                largura = x2 - x1
                altura = y2 - y1
                recorte = imagem[y1:y2, x1:x2]

                if largura <= 0 or altura <= 0 or recorte.size == 0:
                    continue

                proporcao = largura / altura

                if altura < ALTURA_MINIMA_ANALISE_BOCA:
                    boca = 0.0
                else:
                    gray = cv2.cvtColor(recorte, cv2.COLOR_BGR2GRAY)
                    imagem_clahe = self.clahe.apply(gray)
                    boca = (
                        self.extrair_estado_boca(imagem_clahe)
                        if USAR_METRICA_BOCA
                        else 0.0
                    )

                confianca = (
                    float(caixa.conf[0].item())
                    if caixa.conf is not None
                    else None
                )

                detalhes_alunos.append(
                    {
                        "bbox": [x1, y1, x2, y2],
                        "confianca_yolo": round(confianca, 4)
                        if confianca is not None
                        else None,
                        "boca": round(boca, 2),
                        "proporcao": round(proporcao, 2),
                    }
                )

        total = len(detalhes_alunos)
        modo_coletivo = False

        if total >= 3:
            alunos_virados = sum(
                1
                for aluno in detalhes_alunos
                if aluno["proporcao"] < PROPORCAO_MIN_PERFIL
            )
            porcentagem_virados = alunos_virados / total
            modo_coletivo = porcentagem_virados >= 0.60

        focados = 0
        parciais = 0
        distraidos = 0
        distraidos_equivalentes = 0.0
        soma_indices = 0.0

        for i, aluno in enumerate(detalhes_alunos, start=1):
            indice, status, cor = self.calcular_indice_final(
                aluno["proporcao"],
                aluno["boca"],
                modo_coletivo,
            )

            aluno["aluno"] = i
            aluno["indice"] = round(indice, 2)
            aluno["status"] = status
            aluno["cor_bgr"] = list(cor)

            soma_indices += indice

            if status == "FOCADO":
                focados += 1
            elif status == "PARCIAL":
                parciais += 1
                distraidos_equivalentes += 0.5
            else:
                distraidos += 1
                distraidos_equivalentes += 1.0

        media_turma = soma_indices / total if total > 0 else 0.0

        return {
            "media_atencao": round(media_turma, 2),
            "total_alunos": total,
            "focados": focados,
            "parciais": parciais,
            "distraidos": distraidos,
            "distraidos_equivalentes": distraidos_equivalentes,
            "modo_coletivo": modo_coletivo,
            "detalhes_alunos": detalhes_alunos,
        }

    @staticmethod
    def _desenhar_rotulo(imagem, texto, x, y, cor):
        fonte = cv2.FONT_HERSHEY_SIMPLEX
        escala = 0.52
        espessura = 1
        margem = 4

        (largura_texto, altura_texto), baseline = cv2.getTextSize(
            texto,
            fonte,
            escala,
            espessura,
        )

        y_texto = max(y, altura_texto + baseline + 2 * margem)
        topo = y_texto - altura_texto - baseline - 2 * margem
        direita = min(imagem.shape[1] - 1, x + largura_texto + 2 * margem)

        cv2.rectangle(
            imagem,
            (x, topo),
            (direita, y_texto),
            cor,
            thickness=-1,
        )
        cv2.putText(
            imagem,
            texto,
            (x + margem, y_texto - baseline - margem),
            fonte,
            escala,
            (0, 0, 0),
            espessura,
            cv2.LINE_AA,
        )

    def desenhar_resultados(self, imagem, resultado):
        saida = imagem.copy()

        for aluno in resultado["detalhes_alunos"]:
            x1, y1, x2, y2 = aluno["bbox"]
            cor = tuple(aluno["cor_bgr"])

            cv2.rectangle(saida, (x1, y1), (x2, y2), cor, 2)

            texto = (
                f"A{aluno['aluno']} {aluno['status']} "
                f"idx={aluno['indice']:.2f} "
                f"p={aluno['proporcao']:.2f} "
                f"b={aluno['boca']:.2f}"
            )
            self._desenhar_rotulo(saida, texto, x1, y1, cor)

        resumo = (
            f"Media={resultado['media_atencao']:.2f} | "
            f"Rostos={resultado['total_alunos']} | "
            f"F={resultado['focados']} P={resultado['parciais']} "
            f"D={resultado['distraidos']} | "
            f"Coletivo={'SIM' if resultado['modo_coletivo'] else 'NAO'}"
        )

        cv2.rectangle(saida, (0, 0), (min(saida.shape[1], 760), 34), (255, 255, 255), -1)
        cv2.putText(
            saida,
            resumo,
            (8, 23),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.55,
            (0, 0, 0),
            1,
            cv2.LINE_AA,
        )

        return saida


def encontrar_imagens(entrada: Path):
    if entrada.is_file():
        if entrada.suffix.lower() not in EXTENSOES_IMAGEM:
            raise ValueError(f"Arquivo nao reconhecido como imagem: {entrada}")
        return [entrada]

    if not entrada.is_dir():
        raise FileNotFoundError(f"Entrada nao encontrada: {entrada}")

    return sorted(
        caminho
        for caminho in entrada.iterdir()
        if caminho.is_file() and caminho.suffix.lower() in EXTENSOES_IMAGEM
    )


def salvar_csv(caminho_csv: Path, linhas):
    campos = [
        "imagem",
        "aluno",
        "x1",
        "y1",
        "x2",
        "y2",
        "confianca_yolo",
        "proporcao",
        "boca",
        "indice",
        "status",
        "modo_coletivo",
        "media_atencao_imagem",
    ]

    with caminho_csv.open("w", newline="", encoding="utf-8") as arquivo:
        writer = csv.DictWriter(arquivo, fieldnames=campos)
        writer.writeheader()
        writer.writerows(linhas)


def main():
    parser = argparse.ArgumentParser(
        description=(
            "Testa o YOLO de rostos do FOCA em uma imagem ou pasta e salva "
            "bounding boxes com os indices de atencao."
        )
    )
    parser.add_argument(
        "--input",
        required=True,
        help="Imagem individual ou pasta contendo imagens de teste.",
    )
    parser.add_argument(
        "--model",
        required=True,
        help="Caminho para o arquivo best.pt do modelo YOLO.",
    )
    parser.add_argument(
        "--output",
        default="resultados_teste_foca",
        help="Pasta onde os resultados serao salvos.",
    )
    args = parser.parse_args()

    entrada = Path(args.input)
    modelo = Path(args.model)
    saida = Path(args.output)

    if not modelo.exists():
        raise FileNotFoundError(f"Modelo nao encontrado: {modelo}")

    imagens = encontrar_imagens(entrada)
    if not imagens:
        raise RuntimeError(f"Nenhuma imagem encontrada em: {entrada}")

    pasta_anotadas = saida / "imagens_anotadas"
    pasta_anotadas.mkdir(parents=True, exist_ok=True)

    testador = TestadorFoca(str(modelo))

    resultados_json = []
    linhas_csv = []

    for numero, caminho_imagem in enumerate(imagens, start=1):
        print(f"[{numero}/{len(imagens)}] Processando {caminho_imagem.name}...")

        imagem = cv2.imread(str(caminho_imagem))
        if imagem is None:
            print(f"  AVISO: nao foi possivel abrir {caminho_imagem}")
            continue

        resultado = testador.processar_imagem(imagem)
        imagem_anotada = testador.desenhar_resultados(imagem, resultado)

        nome_saida = f"{caminho_imagem.stem}_resultado.jpg"
        caminho_saida = pasta_anotadas / nome_saida
        cv2.imwrite(str(caminho_saida), imagem_anotada)

        registro = {
            "imagem": caminho_imagem.name,
            "imagem_anotada": str(caminho_saida),
            **resultado,
        }
        resultados_json.append(registro)

        for aluno in resultado["detalhes_alunos"]:
            x1, y1, x2, y2 = aluno["bbox"]
            linhas_csv.append(
                {
                    "imagem": caminho_imagem.name,
                    "aluno": aluno["aluno"],
                    "x1": x1,
                    "y1": y1,
                    "x2": x2,
                    "y2": y2,
                    "confianca_yolo": aluno["confianca_yolo"],
                    "proporcao": aluno["proporcao"],
                    "boca": aluno["boca"],
                    "indice": aluno["indice"],
                    "status": aluno["status"],
                    "modo_coletivo": resultado["modo_coletivo"],
                    "media_atencao_imagem": resultado["media_atencao"],
                }
            )

        print(
            f"  rostos={resultado['total_alunos']} "
            f"media={resultado['media_atencao']:.2f} "
            f"coletivo={resultado['modo_coletivo']}"
        )

    caminho_json = saida / "resultados.json"
    with caminho_json.open("w", encoding="utf-8") as arquivo:
        json.dump(resultados_json, arquivo, indent=2, ensure_ascii=False)

    caminho_csv = saida / "deteccoes.csv"
    salvar_csv(caminho_csv, linhas_csv)

    print("\nTeste concluido.")
    print(f"Imagens anotadas: {pasta_anotadas}")
    print(f"JSON: {caminho_json}")
    print(f"CSV: {caminho_csv}")


if __name__ == "__main__":
    main()
