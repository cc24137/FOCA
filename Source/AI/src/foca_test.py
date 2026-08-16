import cv2
import time
import os
from foca_engine import FocaEngine

engine = FocaEngine()

def testar_imagem(caminho_imagem):

    img = cv2.imread(caminho_imagem)
    if img is None:
        print(f"Imagem não encontrada. Verifique o caminho: {caminho_imagem}")
        return

    inicio = time.time()
    resultado = engine.processar_frame(img)
    fim = time.time()

    if not resultado or resultado['total_alunos'] == 0:
        print(f"Nenhum rosto foi detectado na imagem: {caminho_imagem}")
        return

    img_indices = img.copy()
    img_dados = img.copy()

    for i, aluno in enumerate(resultado['detalhes_alunos'], start=1):
        x1, y1, x2, y2 = aluno['bbox']
        cor = aluno['cor']

        # Desenha a bounding box em ambas as imagens
        cv2.rectangle(img_indices, (x1, y1), (x2, y2), cor, 2)
        cv2.rectangle(img_dados, (x1, y1), (x2, y2), cor, 2)

        # Na imagem V1 (Índices): ID + Índice + Status
        texto_indice = f"A{i:02d} | Ind: {aluno['indice']:.2f} | {aluno['status']}"
        cv2.putText(img_indices, texto_indice, (x1, max(15, y1 - 10)), cv2.FONT_HERSHEY_SIMPLEX, 0.5, cor, 2)

        # Na imagem V2 (Dados Brutos): ID + Proporção + Boca
        texto_dados = f"A{i:02d} | P: {aluno['proporcao']:.2f} | B: {aluno['boca']:.2f}"
        cv2.putText(img_dados, texto_dados, (x1, max(15, y1 - 10)), cv2.FONT_HERSHEY_SIMPLEX, 0.5, cor, 2)

    nome_ficheiro = os.path.basename(caminho_imagem).split('.')[0]

    os.makedirs("results", exist_ok=True)
    os.makedirs(f"results/{nome_ficheiro}", exist_ok=True)

    caminho_v1 = f"results/{nome_ficheiro}/resultado_{nome_ficheiro}_V1_Indices.jpg"
    caminho_v2 = f"results/{nome_ficheiro}/resultado_{nome_ficheiro}_V2_DadosBrutos.jpg"
    caminho_txt = f"results/{nome_ficheiro}/resultado_{nome_ficheiro}_Relatorio.txt"

    cv2.imwrite(caminho_v1, img_indices)
    cv2.imwrite(caminho_v2, img_dados)

    # --- GERAÇÃO DO RELATÓRIO TÉCNICO DETALHADO (.TXT) ---
    with open(caminho_txt, "w", encoding="utf-8") as arquivo_txt:
        arquivo_txt.write("=====================================================\n")
        arquivo_txt.write("    RELATÓRIO DE ANÁLISE TÉCNICA - FOCA ENGINE\n")
        arquivo_txt.write("=====================================================\n")
        arquivo_txt.write(f"Imagem analisada : {caminho_imagem}\n")
        arquivo_txt.write(f"Tempo de execução: {fim - inicio:.2f} segundos\n\n")

        arquivo_txt.write("[RESUMO DA TURMA]\n")
        arquivo_txt.write(f"• Média de Atenção: {resultado['media_atencao']}\n")
        arquivo_txt.write(f"• Total de Alunos : {resultado['total_alunos']}\n")
        arquivo_txt.write(f"• Focados         : {resultado['focados']}\n")
        arquivo_txt.write(f"• Distraídos      : {resultado['distraidos']}\n\n")

        arquivo_txt.write("[MÉTRICAS DETALHADAS POR ALUNO]\n")
        arquivo_txt.write("-----------------------------------------------------\n")

        for i, aluno in enumerate(resultado['detalhes_alunos'], start=1):
            x1, y1, x2, y2 = aluno['bbox']
            largura = x2 - x1
            altura = y2 - y1

            arquivo_txt.write(f"Aluno {i:02d}:\n")
            arquivo_txt.write(f"  • Caixas de Detecção (BBox) : (x1={x1}, y1={y1}, x2={x2}, y2={y2})\n")
            arquivo_txt.write(f"  • Dimensões Reais da Caixa  : Largura = {largura}px | Altura = {altura}px\n")
            arquivo_txt.write(f"  • Razão de Aspecto (L / A)  : {aluno['proporcao']:.2f}\n")
            arquivo_txt.write(f"  • Métrica da Boca (0.0~1.0) : {aluno['boca']:.2f}\n")
            arquivo_txt.write(f"    └─ Cálculo: Recorte dos 35% inferiores + CLAHE + Threshold OTSU\n")
            arquivo_txt.write(f"  • Índice Final Calculado    : {aluno['indice']:.2f}\n")
            arquivo_txt.write(f"  • Status de Atenção         : {aluno['status']}\n")
            arquivo_txt.write("-----------------------------------------------------\n")

    # Exibe no terminal
    print(f"\n[{nome_ficheiro}] Processado em: {fim - inicio:.2f}s")
    print("RESULTADO DA TURMA:")
    print(f"   • Média de Atenção: {resultado['media_atencao']}")
    print(f"   • Total de Alunos:  {resultado['total_alunos']} ({resultado['focados']} Focados / {resultado['distraidos']} Distraídos)")
    print(f"   -> {caminho_v1}")
    print(f"   -> {caminho_v2}")
    print(f"   -> {caminho_txt}\n")


def testar_apenas_yolo(caminho_imagem):
    img = cv2.imread(caminho_imagem)
    if img is None:
        print("Imagem não encontrada. Verifique o caminho.")
        return

    print(f"\n[{caminho_imagem}] A iniciar teste APENAS YOLOv8...")
    inicio = time.time()

    resultados_yolo = engine.yolo(img, conf=0.4, verbose=False)
    fim = time.time()

    img_yolo = img.copy()
    total_rostos = 0

    for resultado in resultados_yolo:
        for caixa in resultado.boxes:
            x1, y1, x2, y2 = map(int, caixa.xyxy[0])
            confianca = float(caixa.conf[0])

            cv2.rectangle(img_yolo, (x1, y1), (x2, y2), (255, 0, 0), 2)
            cv2.putText(img_yolo, f"{confianca:.2f}", (x1, max(15, y1 - 10)), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 0, 0), 2)

            total_rostos += 1

    nome_ficheiro = os.path.basename(caminho_imagem).split('.')[0]

    os.makedirs("results", exist_ok=True)
    os.makedirs(f"results/{nome_ficheiro}", exist_ok=True)
    caminho_v3 = f"results/{nome_ficheiro}/resultado_{nome_ficheiro}_V3_ApenasYOLO.jpg"
    cv2.imwrite(caminho_v3, img_yolo)

    print(f" Tempo de processamento (Apenas YOLO): {fim - inicio:.2f} segundos")
    print(f" Total de rostos puros detectados: {total_rostos}")
    print(f"   -> {caminho_v3}\n")


if __name__ == "__main__":
    imagens_teste = [
        "imagens_teste/ajustandoFoca (1).jpeg",
        "imagens_teste/ajustandoFoca (2).jpeg",
        "imagens_teste/ajustandoFoca (3).jpeg",
        "imagens_teste/ajustandoFoca (4).jpeg",
        "imagens_teste/ajustandoFoca (5).jpeg",
        "imagens_teste/ajustandoFoca (6).jpeg",
        "imagens_teste/ajustandoFoca (7).jpeg",
        "imagens_teste/ajustandoFoca (8).jpeg",
        "imagens_teste/ajustandoFoca (9).jpeg",
    ]

    for img in imagens_teste:
        testar_imagem(img)
