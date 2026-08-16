import cv2
import time
import os
from foca_engine import FocaEngine

engine = FocaEngine()

def testar_imagem(caminho_imagem):

    img = cv2.imread(caminho_imagem)
    if img is None:
        print("imagem não encontrada. Verifique o caminho.")
        return

    inicio = time.time()
    resultado = engine.processar_frame(img)
    fim = time.time()

    if not resultado or resultado['total_alunos'] == 0:
        print("Nenhum rosto foi detectado na imagem.")
        return

    img_indices = img.copy()
    img_dados = img.copy()

    # Usando enumerate(..., start=1) para gerar o ID do aluno igual ao do relatório .txt
    for i, aluno in enumerate(resultado['detalhes_alunos'], start=1):
        x1, y1, x2, y2 = aluno['bbox']
        cor = aluno['cor']

        # Desenha a bounding box em ambas as imagens
        cv2.rectangle(img_indices, (x1, y1), (x2, y2), cor, 2)
        cv2.rectangle(img_dados, (x1, y1), (x2, y2), cor, 2)

        # Na imagem V1 (Índices), colocamos o Número do Aluno + Status
        texto_indice = f"Aluno {i:02d} ({aluno['status']})"
        cv2.putText(img_indices, texto_indice, (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, cor, 2)

        # Na imagem V2 (Dados Brutos), colocamos APENAS o Número do Aluno para limpar a imagem
        texto_dados = f"Aluno {i:02d}"
        cv2.putText(img_dados, texto_dados, (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.6, cor, 2)

    os.makedirs("results", exist_ok=True)

    nome_ficheiro = os.path.basename(caminho_imagem).split('.')[0]
    caminho_v1 = f"results/resultado_{nome_ficheiro}_V1_Indices.jpg"
    caminho_v2 = f"results/resultado_{nome_ficheiro}_V2_DadosBrutos.jpg"
    caminho_txt = f"results/resultado_{nome_ficheiro}_Relatorio.txt"

    cv2.imwrite(caminho_v1, img_indices)
    cv2.imwrite(caminho_v2, img_dados)

    # --- Geração do Relatório em .txt ---
    with open(caminho_txt, "w", encoding="utf-8") as arquivo_txt:
        arquivo_txt.write("=========================================\n")
        arquivo_txt.write(f"RELATÓRIO DE ANÁLISE - FOCA ENGINE\n")
        arquivo_txt.write("=========================================\n")
        arquivo_txt.write(f"Imagem analisada: {caminho_imagem}\n")
        arquivo_txt.write(f"Tempo de processamento: {fim - inicio:.2f} segundos\n\n")

        arquivo_txt.write("[RESUMO DA TURMA]\n")
        arquivo_txt.write(f"Média de Atenção: {resultado['media_atencao']}\n")
        arquivo_txt.write(f"Total de Alunos:  {resultado['total_alunos']}\n")
        arquivo_txt.write(f"Focados:          {resultado['focados']}\n")
        arquivo_txt.write(f"Distraídos:       {resultado['distraidos']}\n\n")

        arquivo_txt.write("[MÉTRICAS DETALHADAS POR ALUNO]\n")
        for i, aluno in enumerate(resultado['detalhes_alunos'], start=1):
            bbox = aluno['bbox']
            arquivo_txt.write(
                f"Aluno {i:02d} | BBox: ({bbox[0]:03d}, {bbox[1]:03d}, {bbox[2]:03d}, {bbox[3]:03d}) | "
                f"PR (Postura): {aluno['proporcao']:.2f} | "
                f"B (Boca): {aluno['boca']:.2f} | "
                f"Status: {aluno['status']}\n"
            )

    # Exibe os resultados no terminal
    print(f" Tempo de processamento: {fim - inicio:.2f} segundos")
    print("RESULTADO FINAL DA TURMA:")
    print(f"   • Média de Atenção: {resultado['media_atencao']}")
    print(f"   • Total de Alunos:  {resultado['total_alunos']} ({resultado['focados']} Focados / {resultado['distraidos']} Distraídos)")
    print(f"   -> {caminho_v1}")
    print(f"   -> {caminho_v2}")
    print(f"   -> {caminho_txt}")

def testar_apenas_yolo(caminho_imagem):
    img = cv2.imread(caminho_imagem)
    if img is None:
        print("imagem não encontrada. Verifique o caminho.")
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
            cv2.putText(img_yolo, f"{confianca:.2f}", (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 0, 0), 2)

            total_rostos += 1
    os.makedirs("results", exist_ok=True)

    nome_ficheiro = os.path.basename(caminho_imagem).split('.')[0]
    caminho_v3 = f"results/resultado_{nome_ficheiro}_V3_ApenasYOLO.jpg"
    cv2.imwrite(caminho_v3, img_yolo)

    print(f" Tempo de processamento (Apenas YOLO): {fim - inicio:.2f} segundos")
    print(f" Total de rostos puros detectados: {total_rostos}")
    print(f"   -> {caminho_v3}\n")


# rodar com imagem teste
if __name__ == "__main__":
    testar_imagem("imagens_teste/testeTurma.jpg")
    testar_apenas_yolo("imagens_teste/testeTurma.jpg")
