import cv2
import time
import os
from niko_engine import NikoEngine

engine = NikoEngine()

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

    for aluno in resultado['detalhes_alunos']:
        x1, y1, x2, y2 = aluno['bbox']
        cor = aluno['cor']

        # Desenha a bounding box em ambas as imagens
        cv2.rectangle(img_indices, (x1, y1), (x2, y2), cor, 2)
        cv2.rectangle(img_dados, (x1, y1), (x2, y2), cor, 2)

        # indices e status
        texto_indice = f"{aluno['status']} {aluno['indice']:.2f}"
        cv2.putText(img_indices, texto_indice, (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, cor, 2)

        # Dados extraidos
        # Mostra a Abertura Ocular (Ab), Direção (D) e a Proporção da Bbox (PR)
        texto_dados = f"Ab:{aluno['abertura']:.2f} D:{aluno['direcao']:.2f} PR:{aluno['proporcao']:.2f}"

        cv2.putText(img_dados, texto_dados, (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, cor, 2)

    # Escreve a média global no canto de ambas as imagens
    #texto_media = f"Media Turma: {resultado['media_atencao']:.2f}"
    #cv2.rectangle(img_indices, (10, 10), (350, 50), (0, 0, 0), -1)
    #cv2.putText(img_indices, texto_media, (20, 40), cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2)

    #cv2.rectangle(img_dados, (10, 10), (350, 50), (0, 0, 0), -1)
    #cv2.putText(img_dados, texto_media, (20, 40), cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2)

    os.makedirs("results", exist_ok=True)

    nome_ficheiro = os.path.basename(caminho_imagem).split('.')[0]
    caminho_v1 = f"results/resultado_{nome_ficheiro}_V1_Indices.jpg"
    caminho_v2 = f"results/resultado_{nome_ficheiro}_V2_DadosBrutos.jpg"

    cv2.imwrite(caminho_v1, img_indices)
    cv2.imwrite(caminho_v2, img_dados)

    # Exibe os resultados no terminal
    print(f" Tempo de processamento: {fim - inicio:.2f} segundos")
    print("RESULTADO FINAL DA TURMA:")
    print(f"   • Média de Atenção: {resultado['media_atencao']}")
    print(f"   • Total de Alunos:  {resultado['total_alunos']} ({resultado['focados']} Focados / {resultado['distraidos']} Distraídos)")
    print(f"   -> {caminho_v1}")
    print(f"   -> {caminho_v2}")

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

    # Garante que a pasta results existe antes de salvar
    os.makedirs("results", exist_ok=True)

    # Salva o arquivo no disco
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
