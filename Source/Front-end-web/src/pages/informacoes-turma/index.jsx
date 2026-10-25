import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "../../components/header";
import Combobox from "../../components/combobox";
import GenericLineChart from "../../components/time-vs-value-chart";
import GenericBarChart from "../../components/bar-chart";
import AnalysisDisclaimer from "../../components/analysis-disclaimer";
import { unificarLinhasDoTempo } from "../../utils/chartHelpers"; 
import api from "../../services/api";
import "./informacoes-turma.css";
import { useToast } from '../../components/toast';
import CheckIcon from '../../assets/check-small.svg?react';
import ClearIcon from '../../assets/close.svg?react';

const PALETA_CORES = [
  'var(--indigo)', 
  'var(--success-accent)', 
  'var(--warning-accent)', 
  'var(--error-accent)', 
  'var(--chart-violet)', 
  'var(--chart-cyan)', 
  'var(--chart-pink)', 
];

function possuiResultadoAnalise(aula) {
    const media = aula.media_atencao_total;
    if (typeof media !== 'number' && (typeof media !== 'string' || media.trim() === '')) {
        return false;
    }

    // A média de 0% também representa uma análise válida.
    const valor = Number(media);
    return Number.isFinite(valor) && valor >= 0 && valor <= 100;
}

export default function InformacoesTurma() {
    const { showToast } = useToast();
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

    const [dadosComparativos, setDadosComparativos] = useState([]);
    const [configuracaoLinhas, setConfiguracaoLinhas] = useState([]);
    const [jaComparou, setJaComparou] = useState(false);

    useEffect(() => {
        let ativo = true;
        async function fetchDetalhes() {
            setLoading(true);
            try {
                const user = JSON.parse(localStorage.getItem('@FOCA:user'));
                const loggedUserId = user?.id;

                const [resTurma, resAulas] = await Promise.all([
                    api.get(`/turmaRelacao/${id}`),
                    api.get(`/aula/${id}`)
                ]);
                if (!ativo) return;

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
                    const dadosAulas = Array.isArray(resAulas.data) ? resAulas.data : [resAulas.data];
                    console.table(dadosAulas); 
                    setAulas(dadosAulas);
                }
            } catch (error) {
                console.error("Erro ao procurar as informações:", error);
                if (ativo) showToast("Não foi possível carregar as informações desta turma. Tente novamente.", { type: 'error' });
            } finally {
                if (ativo) setLoading(false);
            }
        }

        if (id) fetchDetalhes();
        return () => { ativo = false; };
    }, [id, showToast]);

    const aulasHistorico = [...aulas].sort((primeira, segunda) =>
        new Date(segunda.data).getTime() - new Date(primeira.data).getTime() ||
        Number(segunda.id) - Number(primeira.id)
    );

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

            const aulasFiltradas = aulas.filter(aula =>
                aulasSelecionadas.some(sel => sel.value === aula.id.toString())
            );

            const listaParaUnificar = await Promise.all(
                aulasFiltradas.map(async (aula) => {
                    const indexOriginal = aulas.findIndex(a => a.id === aula.id);
                    const res = await api.get(`/leituraAtencao/${aula.id}`);
                    const logsDoBanco = res.data;

                    const dataFormatada = logsDoBanco.map(log => ({
                        segundos: log.segundoVideo,
                        temp: log.indiceAtencao 
                    }));

                    return {
                        id: `aula_${aula.id}`,
                        label: `Aula ${indexOriginal + 1} (${new Date(aula.data).toLocaleDateString('pt-PT')})`,
                        data: dataFormatada
                    };
                })
            );

            const linhasConfig = listaParaUnificar.map((item, index) => ({
                key: item.id,
                label: item.label,
                color: PALETA_CORES[index % PALETA_CORES.length]
            }));

            const dadosUnificados = unificarLinhasDoTempo(listaParaUnificar);

            if (dadosUnificados.length === 0) {
                showToast("As aulas selecionadas não possuem dados de atenção para comparar.", { type: 'info' });
            }

            setDadosComparativos(dadosUnificados);
            setConfiguracaoLinhas(linhasConfig);
            setJaComparou(true);

        } catch (error) {
            console.error("Erro ao buscar dados de atenção das aulas:", error);
            showToast("Não foi possível carregar os dados de atenção para a comparação. Tente novamente.", { type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    if (!isAuthorized) {
        return (
            <div className='informacoes-turma-container'>
                <Header />
                <div className='informacoes-turma-content' style={{ textAlign: 'center', marginTop: '100px' }}>
                    <h2 style={{ color: 'var(--error-muted)', marginBottom: '20px' }}>Acesso Negado</h2>
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
                        <button className='informacoes-turma-box-button' onClick={() => goTo('/cadastro-aula', { idRelacao: id, nomeTurma: turma.nome, nomeDisciplina: turma.disciplina, instituicao: turma.instituicao, quantidadeAlunos: turma.alunos})}>
                            <p className='informacoes-turma-box-button-text'>Nova Aula</p>
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

                {/* Comparação de Aulas */}
                <div className='informacoes-turma-box-comparacao-aulas'>
                    <p className='informacoes-turma-box-comparacao-aulas-title analysis-disclaimer-heading'>
                        Comparação detalhada
                        <AnalysisDisclaimer label="Como interpretar os resultados e as comparações das aulas" />
                    </p>
                    
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
                                        backgroundColor: 'var(--transparent-light-blue)',
                                        color: 'var(--indigo)',
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
                            <p style={{ textAlign: 'center', padding: '20px', color: 'var(--button-disabled-gray)' }}>
                                Nenhuma medição/log disponível para as aulas selecionadas.
                            </p>
                        ) : (
                            <p style={{ textAlign: 'center', padding: '30px', color: 'var(--text-subtle)', fontSize: '0.9rem' }}>
                                Selecione uma ou mais aulas acima e clique em <strong>Comparar</strong> para visualizar o gráfico sobreposto.
                            </p>
                        )}
                    </div>
                </div>

                {/* Seção Lado a Lado no Desktop: Atenção Média + Histórico de Aulas */}
                <div className='informacoes-turma-row-group'>
                    {/* Box de Atenção Média */}
                    <div className='informacoes-turma-box-atencao-media'>
                        <p className='informacoes-turma-box-atencao-media-title'>Atenção média</p>
                        <div className='informacoes-turma-box-atencao-media-content'>
                            {loading && <p style={{padding: '10px'}}>Calculando dados...</p>}
                            {!loading && aulas.length > 0 && (
                                <GenericBarChart
                                    data={aulas.map((aula, index) => ({
                                        label: `Aula ${index + 1} (${new Date(aula.data).toLocaleDateString('pt-PT')})`,
                                        value: aula.media_atencao_total || 0
                                    }))}
                                    xKey="label"
                                    yKey="value"
                                    barColor="var(--indigo)"
                                />
                            )}
                            {!loading && aulas.length === 0 && (
                                <p style={{padding: '10px'}}>Nenhuma aula encontrada.</p>
                            )}
                        </div>
                    </div>

                    {/* Histórico de Aulas */}
                    <div className='informacoes-turma-box-historico-aulas'>
                        <p className='informacoes-turma-box-historico-aulas-title'>Histórico de aulas</p>
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
                                            <th>Resultado da análise</th>
                                            <th>Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {aulasHistorico.map((aula) => {
                                            const temResultado = possuiResultadoAnalise(aula);
                                            return (
                                            <tr key={aula.id}>
                                                <td>{new Date(aula.data).toLocaleDateString('pt-PT')}</td>
                                                <td>{aula.conteudo}</td>
                                                <td>{aula.nome_classificacao || 'Sem classificação'}</td>
                                                <td>
                                                    <span className={`status-badge ${temResultado ? 'com-analise' : 'sem-analise'}`}>
                                                        {temResultado ? 'Disponível' : 'Sem resultado'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <button
                                                        type="button"
                                                        className="btn-enviar-video"
                                                        onClick={() => goTo('/upload-video', { idAula: aula.id })}
                                                    >
                                                        Enviar vídeo
                                                    </button>
                                                </td>
                                            </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            ) : (
                                <p style={{ padding: '20px' }}>Nenhuma aula encontrada.</p>
                            )}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
