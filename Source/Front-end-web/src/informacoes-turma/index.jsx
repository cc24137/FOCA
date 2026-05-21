import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import Header from "../components/header";
import Combobox from "../components/combobox";
import api from "../services/api";
import "./informacoes-turma.css";

// Ícones para usar nas tags
function CheckIcon(props) {
  return (
    <svg
      fill="currentcolor"
      width="10"
      height="10"
      viewBox="0 0 10 10"
      {...props}
    >
      <path d="M9.1603 1.12218C9.50684 1.34873 9.60427 1.81354 9.37792 2.16038L5.13603 8.66012C5.01614 8.8438 4.82192 8.96576 4.60451 8.99384C4.3871 9.02194 4.1683 8.95335 4.00574 8.80615L1.24664 6.30769C0.939709 6.02975 0.916013 5.55541 1.19372 5.24822C1.47142 4.94102 1.94536 4.91731 2.2523 5.19524L4.36085 7.10461L8.12299 1.33999C8.34934 0.993152 8.81376 0.895638 9.1603 1.12218Z" />
    </svg>
  );
}

function ClearIcon(props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M18 6L6 18" />
      <path d="M6 6l12 12" />
    </svg>
  );
}

export default function InformacoesTurma() {
  // Captura o parâmetro passado pela URL (verifique se no seu App.jsx/Routes a rota é algo como path="/informacoes-turma/:id")
  const { id } = useParams();

  const [aulasSelecionadas, setAulasSelecionadas] = useState([]);
  const [turma, setTurma] = useState(null);
  const [aulas, setAulas] = useState([]);
  const [loading, setLoading] = useState(true);

  // Carregar os dados ao montar o ecrã
  useEffect(() => {
    async function fetchDetalhes() {
      try {
        // Fazer as requisições em paralelo para otimizar o tempo de resposta
        const [resTurma, resAulas] = await Promise.all([
          api.get(`/turmaRelacao/${id}`),
          api.get(`/aula/${id}`)
        ]);

        // Como a API não devolve "alunos" nem "serie" ainda, colocamos valores default '-'
        if (resTurma.data) {
          setTurma({
            nome: resTurma.data.nomeTurma || "Sem nome",
            alunos: resTurma.data.alunosTurma || "-",
            instituicao: resTurma.data.nomeInstituicao || "Sem Instituição",
            serie: resTurma.data.serieTurma || "-",
            disciplina: resTurma.data.nomeDisciplina || "Sem Disciplina"
          });
        }

        // O resAulas.data agora deve ser um array graças ao ajuste no seu recordset
        if (resAulas.data && Array.isArray(resAulas.data)) {
          setAulas(resAulas.data);
        } else if (resAulas.data) {
          // Por segurança, se vier um único objeto em vez de array
          setAulas([resAulas.data]);
        }
      } catch (error) {
        console.error("Erro ao procurar as informações da turma:", error);
        alert("Ocorreu um erro ao carregar os dados.");
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      fetchDetalhes();
    }
  }, [id]);

  // Transforma os dados reais das aulas num formato que a Combobox aceita
  const listaDeAulas = aulas.map((aula, index) => ({
    label: `Aula ${index + 1} - ${new Date(aula.data).toLocaleDateString(
      "pt-PT"
    )} ${aula.nome_classificacao ? `(${aula.nome_classificacao})` : ""}`,
    value: aula.id.toString()
  }));

  const handleCompararClick = () => {
    console.log("Aulas prontas para comparar:", aulasSelecionadas);
  };

  const handleRemoverAula = aulaParaRemover => {
    const novaLista = aulasSelecionadas.filter(
      aula => aula.value !== aulaParaRemover.value
    );
    setAulasSelecionadas(novaLista);
  };

  if (loading) {
    return (
      <p style={{ textAlign: "center", marginTop: "50px" }}>
        A carregar informações da turma...
      </p>
    );
  }

  if (!turma) {
    return (
      <p style={{ textAlign: "center", marginTop: "50px" }}>
        Turma não encontrada.
      </p>
    );
  }

  return (
    <div className="informacoes-turma-container">
      <Header />
      <div className="informacoes-turma-content">
        <div className="informacoes-turma-box">
          <div className="informacoes-turma-box-row">
            <p className="informacoes-turma-box-title">{turma.nome}</p>

            <button className="informacoes-turma-box-button">
              <p className="informacoes-turma-box-button-text">nova aula</p>
            </button>
          </div>

          <div className="informacoes-turma-box-container">
            <div className="informacoes-turma-box-container-column">
              <div className="informacoes-turma-box-container-row">
                <p className="informacoes-turma-box-container-row-title">
                  Alunos:{" "}
                </p>
                <p className="informacoes-turma-box-container-row-text">
                  {turma.alunos}
                </p>
              </div>

              <div className="informacoes-turma-box-container-row">
                <p className="informacoes-turma-box-container-row-title">
                  Série:{" "}
                </p>
                <p className="informacoes-turma-box-container-row-text">
                  {turma.serie}
                </p>
              </div>
            </div>

            <div className="informacoes-turma-box-container-column">
              <div className="informacoes-turma-box-container-row">
                <p className="informacoes-turma-box-container-row-title">
                  Disciplina:{" "}
                </p>
                <p className="informacoes-turma-box-container-row-text">
                  {turma.disciplina}
                </p>
              </div>

              <div className="informacoes-turma-box-container-row">
                <p className="informacoes-turma-box-container-row-title">
                  Instituição:{" "}
                </p>
                <p className="informacoes-turma-box-container-row-text">
                  {turma.instituicao}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="informacoes-turma-box-atencao-media">
          <p className="informacoes-turma-box-atencao-media-title">
            Atenção média{" "}
          </p>
          <div className="informacoes-turma-box-atencao-media-content"></div>
        </div>

        <div className="informacoes-turma-box-historico-aulas">
          <p className="informacoes-turma-box-historico-aulas-title">
            Histórico de aulas{" "}
          </p>
          <div className="informacoes-turma-box-historico-aulas-content">
            {/* Tabela de Aulas Dinâmica */}
            {aulas.length > 0 ? (
              <table className="tabela-aulas">
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Conteúdo</th>
                    <th>Classificação</th>
                  </tr>
                </thead>
                <tbody>
                  {aulas.map(aula => (
                    <tr key={aula.id}>
                      <td>{new Date(aula.data).toLocaleDateString("pt-PT")}</td>
                      <td>{aula.conteudo}</td>
                      <td>{aula.nome_classificacao || "Sem classificação"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p style={{ padding: "20px", color: "#666" }}>
                Nenhuma aula registada até ao momento.
              </p>
            )}
          </div>
        </div>

        <div className="informacoes-turma-box-comparacao-aulas">
          <p className="informacoes-turma-box-comparacao-aulas-title">
            Comparação detalhada de diferentes aulas{" "}
          </p>
          <div className="informacoes-turma-box-comparacao-aulas-subtitle-row">
            <div className="informacoes-turma-box-comparacao-aulas-subtitle-row-right">
              <p className="informacoes-turma-comparacao-aulas-label">
                Selecionar aulas:
              </p>

              <Combobox
                items={listaDeAulas}
                placeholder="Buscar aula..."
                selectedItems={aulasSelecionadas}
                onSelectionChange={selectedItems =>
                  setAulasSelecionadas(selectedItems)
                }
              />
            </div>

            <button
              className="informacoes-turma-box-comparacao-aulas-button"
              onClick={handleCompararClick}
            >
              <p className="informacoes-turma-box-comparacao-aulas-button-text">
                Comparar
              </p>
            </button>
          </div>

          <div className="informacoes-turma-box-comparacao-aulas-aulas-selecionadas">
            {aulasSelecionadas.length > 0 ? (
              <div className="turma-tags-container">
                {aulasSelecionadas.map(aula => (
                  <span key={aula.value} className="turma-tag">
                    <CheckIcon className="turma-tag-check-icon" />
                    {aula.label}
                    <button
                      aria-label={`Remover ${aula.label}`}
                      onClick={() => handleRemoverAula(aula)}
                      className="turma-tag-remove-button"
                    >
                      <ClearIcon width={11} height={11} />
                    </button>
                  </span>
                ))}
              </div>
            ) : (
              <p>Nenhuma aula selecionada para comparação.</p>
            )}
          </div>

          <div className="informacoes-turma-box-comparacao-aulas-content"></div>
        </div>
      </div>
    </div>
  );
}
