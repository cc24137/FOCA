import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "../components/header";
import Combobox from "../components/combobox";
import api from "../services/api";
import "./informacoes-turma.css";

// Ícones para usar nas tags
function CheckIcon(props) {
  return (
    <svg fill="currentcolor" width="10" height="10" viewBox="0 0 10 10" {...props}>
      <path d="M9.1603 1.12218C9.50684 1.34873 9.60427 1.81354 9.37792 2.16038L5.13603 8.66012C5.01614 8.8438 4.82192 8.96576 4.60451 8.99384C4.3871 9.02194 4.1683 8.95335 4.00574 8.80615L1.24664 6.30769C0.939709 6.02975 0.916013 5.55541 1.19372 5.24822C1.47142 4.94102 1.94536 4.91731 2.2523 5.19524L4.36085 7.10461L8.12299 1.33999C8.34934 0.993152 8.81376 0.895638 9.1603 1.12218Z" />
    </svg>
  );
}

function ClearIcon(props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M18 6L6 18" />
      <path d="M6 6l12 12" />
    </svg>
  );
}

export default function InformacoesTurma() {
    const { id } = useParams();
    const navigate = useNavigate();

    // Estado para controlar a autorização da página
    const [isAuthorized, setIsAuthorized] = useState(true);

    const [aulasSelecionadas, setAulasSelecionadas] = useState([]);
    const [turma, setTurma] = useState({
        nome: '',
        alunos: '',
        instituicao: '',
        serie: '',
        disciplina: ''
    });
    const [aulas, setAulas] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchDetalhes() {
            setLoading(true);
            try {
                // Pega os dados do usuário logado no localStorage
                const user = JSON.parse(localStorage.getItem('user'));
                const loggedUserId = user?.id;

                const [resTurma, resAulas] = await Promise.all([
                    api.get(`/turmaRelacao/${id}`),
                    api.get(`/aula/${id}`)
                ]);

                if (resTurma.data) {
                    if (String(resTurma.data.idProfessor) !== String(loggedUserId) || user?.isProfessor != true) {
                        setIsAuthorized(false);
                        setLoading(false);
                        return; // Interrompe a função, não carrega os dados no state
                    }

                    setTurma({
                        nome: resTurma.data.nomeTurma || 'Não informado',
                        alunos: resTurma.data.alunosTurma || '-',
                        instituicao: resTurma.data.nomeInstituicao || 'Não informada',
                        serie: resTurma.data.serieTurma || '-',
                        disciplina: resTurma.data.nomeDisciplina || 'Não informada',
                    });
                }

                if (resAulas.data) {
                    setAulas(Array.isArray(resAulas.data) ? resAulas.data : [resAulas.data]);
                }
            } catch (error) {
                console.error("Erro ao procurar as informações:", error);
            } finally {
                setLoading(false);
            }
        }

        if (id) fetchDetalhes();
    }, [id]);

    const listaDeAulas = aulas.map((aula, index) => ({
        label: `Aula ${index + 1} - ${new Date(aula.data).toLocaleDateString('pt-PT')}`,
        value: aula.id.toString()
    }));

    const handleRemoverAula = (aulaParaRemover) => {
        setAulasSelecionadas(prev => prev.filter(a => a.value !== aulaParaRemover.value));
    };


    // TELA DE ACESSO NEGADO: Se a verificação falhar, renderizamos apenas isto
    if (!isAuthorized) {
        return (
            <div className='informacoes-turma-container'>
                <Header />
                <div className='informacoes-turma-content' style={{ textAlign: 'center', marginTop: '100px' }}>
                    <h2 style={{ color: '#d9534f', marginBottom: '20px' }}>Acesso Negado</h2>
                    <p>Você não tem permissão para visualizar os dados desta turma.</p>
                    <button
                        onClick={() => navigate('/')}
                        style={{ marginTop: '20px', padding: '10px 20px', cursor: 'pointer' }}
                    >
                        Voltar para o Início
                    </button>
                </div>
            </div>
        );
    }

    // Se estiver autorizado, renderiza a tela normalmente
    return (
        <div className='informacoes-turma-container'>
            <Header
                routes={[
                    { textButton: "Início", routeButton: "/inicial-professor" },
                    { textButton: "Sobre o Projeto", routeButton: "/" },
                    { textButton: "Perfil", routeButton: "/editar-dados" }
                ]}
            />
            <div className='informacoes-turma-content'>

                {/* Cabeçalho da Turma */}
                <div className='informacoes-turma-box'>
                    <div className='informacoes-turma-box-row'>
                        <p className='informacoes-turma-box-title'>
                            {loading && !turma.nome ? "A carregar..." : turma.nome}
                        </p>
                        <button className='informacoes-turma-box-button'>
                            <p className='informacoes-turma-box-button-text'>nova aula</p>
                        </button>
                    </div>

                    <div className='informacoes-turma-box-container'>
                        <div className='informacoes-turma-box-container-column'>
                            <div className='informacoes-turma-box-container-row'>
                                <p className='informacoes-turma-box-container-row-title'>Alunos: </p>
                                <p className='informacoes-turma-box-container-row-text'>{turma.alunos || (loading && "...")}</p>
                            </div>
                            <div className='informacoes-turma-box-container-row'>
                                <p className='informacoes-turma-box-container-row-title'>Série: </p>
                                <p className='informacoes-turma-box-container-row-text'>{turma.serie || (loading && "...")}</p>
                            </div>
                        </div>
                        <div className='informacoes-turma-box-container-column'>
                            <div className='informacoes-turma-box-container-row'>
                                <p className='informacoes-turma-box-container-row-title'>Disciplina: </p>
                                <p className='informacoes-turma-box-container-row-text'>{turma.disciplina || (loading && "...")}</p>
                            </div>
                            <div className='informacoes-turma-box-container-row'>
                                <p className='informacoes-turma-box-container-row-title'>Instituição: </p>
                                <p className='informacoes-turma-box-container-row-text'>{turma.instituicao || (loading && "...")}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Box de Atenção (vazia por enquanto) */}
                <div className='informacoes-turma-box-atencao-media'>
                    <p className='informacoes-turma-box-atencao-media-title'>Atenção média </p>
                    <div className='informacoes-turma-box-atencao-media-content'>
                        {loading && <p style={{padding: '10px'}}>Calculando dados...</p>}
                    </div>
                </div>

                {/* Histórico de Aulas */}
                <div className='informacoes-turma-box-historico-aulas'>
                    <p className='informacoes-turma-box-historico-aulas-title'>Histórico de aulas </p>
                    <div className='informacoes-turma-box-historico-aulas-content'>
                        {loading && aulas.length === 0 ? (
                            <p style={{ padding: '20px' }}>Buscando histórico...</p>
                        ) : aulas.length > 0 ? (
                            <table className="tabela-aulas">
                                <thead>
                                    <tr>
                                        <th>Data</th>
                                        <th>Conteúdo</th>
                                        <th>Classificação</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {aulas.map((aula) => (
                                        <tr key={aula.id}>
                                            <td>{new Date(aula.data).toLocaleDateString('pt-PT')}</td>
                                            <td>{aula.conteudo}</td>
                                            <td>{aula.nome_classificacao || 'Sem classificação'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <p style={{ padding: '20px' }}>Nenhuma aula encontrada.</p>
                        )}
                    </div>
                </div>

                {/* Comparação de Aulas */}
                <div className='informacoes-turma-box-comparacao-aulas'>
                    <p className='informacoes-turma-box-comparacao-aulas-title'>Comparação detalhada</p>
                    <div className='informacoes-turma-box-comparacao-aulas-subtitle-row'>
                        <div className='informacoes-turma-box-comparacao-aulas-subtitle-row-right'>
                            <p className='informacoes-turma-comparacao-aulas-label'>Selecionar aulas:</p>
                            <Combobox
                                items={listaDeAulas}
                                placeholder={loading ? "Carregando aulas..." : "Buscar aula..."}
                                selectedItems={aulasSelecionadas}
                                onSelectionChange={setAulasSelecionadas}
                            />
                        </div>
                        <button className='informacoes-turma-box-comparacao-aulas-button'>
                            <p className='informacoes-turma-box-comparacao-aulas-button-text'>Comparar</p>
                        </button>
                    </div>
                    {/* Aqui estaria o mapeamento das tags */}
                </div>
            </div>
        </div>
    );
}
