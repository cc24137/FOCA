import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "../../components/header";
import Combobox from "../../components/combobox";
import GenericLineChart from "../../components/time-vs-value-chart";
import { unificarLinhasDoTempo } from "../../utils/chartHelpers"; // Importado do utils
import api from "../../services/api";
import "./informacoes-turma.css";

const PALETA_CORES = [
  '#4F46E5', 
  '#10B981', 
  '#F59E0B', 
  '#EF4444', 
  '#8B5CF6', 
  '#06B6D4', 
  '#EC4899', 
];

function CheckIcon(props) {
  return (
    <svg fill="currentColor" width="10" height="10" viewBox="0 0 10 10" {...props}>
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

    function goTo(path, state = null) {
        navigate(path, state ? { state } : undefined);
    }

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

    // Estados para o Gráfico de Comparação
    const [dadosComparativos, setDadosComparativos] = useState([]);
    const [configuracaoLinhas, setConfiguracaoLinhas] = useState([]);
    const [jaComparou, setJaComparou] = useState(false);

    useEffect(() => {
        async function fetchDetalhes() {
            setLoading(true);
            try {
                const user = JSON.parse(localStorage.getItem('@FOCA:user'));
                const loggedUserId = user?.id;

                const [resTurma, resAulas] = await Promise.all([
                    api.get(`/turmaRelacao/${id}`),
                    api.get(`/aula/${id}`)
                ]);

                if (resTurma.data) {
                    if (String(resTurma.data.idProfessor) !== String(loggedUserId) || user?.isProfessor !== true) {
                        setIsAuthorized(false);
                        setLoading(false);
                        return;
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

    const handleComparar = async () => {
        if (aulasSelecionadas.length === 0) {
            setDadosComparativos([]);
            setConfiguracaoLinhas([]);
            setJaComparou(false);
            return;
        }

        try {
            setLoading(true);

            // 1. Filtra as aulas que o usuário escolheu no combobox
            const aulasFiltradas = aulas.filter(aula =>
                aulasSelecionadas.some(sel => sel.value === aula.id.toString())
            );

            // 2. Busca os dados de atenção no backend para todas as aulas em paralelo
            const listaParaUnificar = await Promise.all(
                aulasFiltradas.map(async (aula) => {
                    const indexOriginal = aulas.findIndex(a => a.id === aula.id);
                    alert(`ID da aula: ${aula.id}`);
                    // Chama a rota do backend (ajuste a URL '/leituraAtencao' se o nome no seu controller for diferente)
                    const res = await api.get(`/leituraAtencao/${aula.id}`);
                    const logsDoBanco = res.data;

                    // Mapeia o retorno do banco para o formato { segundos, temp } esperado pelo helper
                    const dataFormatada = logsDoBanco.map(log => ({
                        segundos: log.segundoVideo,
                        // Caso o índice no banco seja de 0.0 a 1.0 e você queira porcentagem (0 a 100), multiplique por 100:
                        temp: log.indiceAtencao <= 1 ? log.indiceAtencao * 100 : log.indiceAtencao 
                    }));

                    return {
                        id: `aula_${aula.id}`,
                        label: `Aula ${indexOriginal + 1} (${new Date(aula.data).toLocaleDateString('pt-PT')})`,
                        data: dataFormatada
                    };
                })
            );

            // 3. Define a configuração de cores e rótulos
            const linhasConfig = listaParaUnificar.map((item, index) => ({
                key: item.id,
                label: item.label,
                color: PALETA_CORES[index % PALETA_CORES.length]
            }));

            // 4. Executa a unificação das linhas do tempo
            const dadosUnificados = unificarLinhasDoTempo(listaParaUnificar);

            setDadosComparativos(dadosUnificados);
            setConfiguracaoLinhas(linhasConfig);
            setJaComparou(true);

        } catch (error) {
            console.error("Erro ao buscar dados de atenção das aulas:", error);
        } finally {
            setLoading(false);
        }
    };

    if (!isAuthorized) {
        return (
            <div className='informacoes-turma-container'>
                <Header />
                <div className='informacoes-turma-content' style={{ textAlign: 'center', marginTop: '100px' }}>
                    <h2 style={{ color: '#d9534f', marginBottom: '20px' }}>Acesso Negado</h2>
                    <p>Você não tem permissão para visualizar os dados desta turma.</p>
                    <button
                        onClick={() => goTo('/')}
                        style={{ marginTop: '20px', padding: '10px 20px', cursor: 'pointer' }}
                    >
                        Voltar para o Início
                    </button>
                </div>
            </div>
        );
    }

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
                        <button className='informacoes-turma-box-button' onClick={() => goTo('/upload-video', { idRelacao: id, nomeTurma: turma.nome, nomeDisciplina: turma.disciplina, instituicao: turma.instituicao, quantidadeAlunos: turma.alunos})}>
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

                {/* Box de Atenção Média */}
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

                        <button 
                            className='informacoes-turma-box-comparacao-aulas-button'
                            onClick={handleComparar}
                        >
                            <p className='informacoes-turma-box-comparacao-aulas-button-text'>Comparar</p>
                        </button>
                    </div>

                    {/* Exibição das Tags Selecionadas */}
                    {aulasSelecionadas.length > 0 && (
                        <div className="aulas-tags-container" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', margin: '15px 0' }}>
                            {aulasSelecionadas.map((aula) => (
                                <span 
                                    key={aula.value} 
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        backgroundColor: '#EEF2FF',
                                        color: '#4F46E5',
                                        padding: '4px 10px',
                                        borderRadius: '16px',
                                        fontSize: '0.85rem',
                                        fontWeight: 500
                                    }}
                                >
                                    <CheckIcon />
                                    {aula.label}
                                    <ClearIcon 
                                        onClick={() => handleRemoverAula(aula)} 
                                        style={{ cursor: 'pointer', width: '12px', height: '12px' }}
                                    />
                                </span>
                            ))}
                        </div>
                    )}

                    {/* Área do Gráfico de Comparação */}
                    <div className="grafico-comparativo-container" style={{ marginTop: '20px' }}>
                        {jaComparou && dadosComparativos.length > 0 ? (
                            <GenericLineChart
                                data={dadosComparativos}
                                xKey="tempoFormatado"
                                lines={configuracaoLinhas}
                            />
                        ) : jaComparou ? (
                            <p style={{ textAlign: 'center', padding: '20px', color: '#6B7280' }}>
                                Nenhuma medição/log disponível para as aulas selecionadas.
                            </p>
                        ) : (
                            <p style={{ textAlign: 'center', padding: '30px', color: '#9CA3AF', fontSize: '0.9rem' }}>
                                Selecione uma ou mais aulas acima e clique em <strong>Comparar</strong> para visualizar o gráfico sobreposto.
                            </p>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}