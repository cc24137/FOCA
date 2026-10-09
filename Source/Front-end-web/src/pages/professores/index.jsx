import Header from '../../components/header';
import ConfirmPopup from '../../components/confirm-popup';
import GenericLineChart from '../../components/time-vs-value-chart';
import './professores.css';
import { useState, useEffect, useRef, useCallback } from 'react';
import api from "../../services/api";
import { useToast } from '../../components/toast';

export default function Professores() {
    const { showToast } = useToast();
    const [professores, setProfessores] = useState([]);
    const [selectedProfessor, setSelectedProfessor] = useState(null);
    const [atencaoProfessor, setAtencaoProfessor] = useState(null);
    const cacheVinculos = useRef(new Map());
    const [confirmacaoRemocao, setConfirmacaoRemocao] = useState(null);
    const [removendo, setRemovendo] = useState(false);
    const [erroRemocao, setErroRemocao] = useState('');
    const remocaoEmAndamento = useRef(false);

    // Novos estados para a funcionalidade de adicionar professor
    const [isAddingProfessor, setIsAddingProfessor] = useState(false);
    const [newProfessorEmail, setNewProfessorEmail] = useState("");

    const professorSelecionado = professores[selectedProfessor];
    const dadosAtencao = professorSelecionado && atencaoProfessor
        && String(atencaoProfessor.idProfessor) === String(professorSelecionado.id)
        ? atencaoProfessor
        : null;
    const statusAtencao = dadosAtencao?.status || (professorSelecionado ? 'carregando' : 'vazio');
    const dadosGrafico = (dadosAtencao?.aulas || []).map((aula, index) => {
        const data = aula.data ? new Date(aula.data) : null;
        const dataFormatada = data && !Number.isNaN(data.getTime())
            ? data.toLocaleDateString('pt-BR', { timeZone: 'UTC' })
            : 'Data não informada';

        return {
            aula: `Aula ${index + 1} - ${dataFormatada} - ${aula.turma || 'Turma não informada'}`,
            mediaAtencao: Number(aula.mediaAtencao.toFixed(2))
        };
    });

    const loadData = useCallback(async (estaAtiva = () => true) => {
        try {
            cacheVinculos.current.clear();
            const response = await api.get("/professor/infosPorInstituicao");
            if (!estaAtiva()) return;
            const data = response.data;

            const professoresAgrupados = [];

            data.forEach(prof => {
                let professorExistente = professoresAgrupados.find(e => String(e.id) === String(prof.id));

                const infoTurma = (prof.turma && prof.disciplina)
                    ? `${prof.turma} (${prof.disciplina})`
                    : null;

                if (!professorExistente) {
                    professorExistente = {
                        id: prof.id,
                        nome: prof.nome,
                        email: prof.email,
                        turmas: [],
                        nomesTurmas: []
                    };
                    professoresAgrupados.push(professorExistente);
                }

                if (infoTurma && !professorExistente.turmas.includes(infoTurma)) {
                    professorExistente.turmas.push(infoTurma);
                }

                if (prof.turma && !professorExistente.nomesTurmas.includes(prof.turma)) {
                    professorExistente.nomesTurmas.push(prof.turma);
                }
            });

            setProfessores(professoresAgrupados);

        } catch (error) {
            if (!estaAtiva()) return;
            if (error.response) {
                console.log("Erro na API: " + error.response.data.message);
                showToast("Não foi possível carregar os professores. Tente novamente.", { type: 'error' });
            } else {
                console.log(error);
                showToast("Erro de conexão com o servidor.", { type: 'error' });
            }
        }
    }, [showToast]);

    useEffect(() => {
        let ativo = true;
        loadData(() => ativo);
        return () => { ativo = false; };
    }, [loadData]);

    useEffect(() => {
        let ativo = true;

        if (!professorSelecionado) {
            setAtencaoProfessor(null);
            return;
        }

        const idProfessor = professorSelecionado.id;
        setAtencaoProfessor({ idProfessor, status: 'carregando', aulas: [], mediaAtencao: null });

        async function consultarVinculos(url, params) {
            const chave = `${url}:${JSON.stringify(params || {})}`;

            if (!cacheVinculos.current.has(chave)) {
                const consulta = api.get(url, params ? { params } : undefined)
                    .then(response => response.data)
                    .catch(error => {
                        if (cacheVinculos.current.get(chave) === consulta) {
                            cacheVinculos.current.delete(chave);
                        }
                        throw error;
                    });
                cacheVinculos.current.set(chave, consulta);
            }

            return cacheVinculos.current.get(chave);
        }

        const comoLista = data => Array.isArray(data) ? data : (data ? [data] : []);

        async function carregarAtencao() {
            try {
                const dataTurmas = await consultarVinculos('/turmas/infosPorInstituicao');
                if (!ativo) return;

                const turmasUnicas = new Map();
                comoLista(dataTurmas).forEach(turma => {
                    if (turma.id != null && professorSelecionado.nomesTurmas.includes(turma.nome)) {
                        turmasUnicas.set(String(turma.id), turma);
                    }
                });

                const relacoesPorTurma = await Promise.all(
                    Array.from(turmasUnicas.values()).map(async turma => {
                        const data = await consultarVinculos('/turmaRelacao/porTurma', { idTurma: turma.id });
                        return comoLista(data).filter(relacao =>
                            relacao.id != null && relacao.nomeProfessor === professorSelecionado.nome
                        );
                    })
                );
                if (!ativo) return;

                const relacoesUnicas = new Map();
                relacoesPorTurma.flat().forEach(relacao => {
                    relacoesUnicas.set(String(relacao.id), relacao);
                });

                // A listagem por turma traz o nome; o detalhe confirma o ID do professor.
                const detalhesRelacoes = await Promise.all(
                    Array.from(relacoesUnicas.values()).map(async relacao => {
                        const detalhes = await consultarVinculos(`/turmaRelacao/${relacao.id}`);
                        return { ...detalhes, idRelacao: relacao.id };
                    })
                );
                if (!ativo) return;

                const relacoesProfessor = detalhesRelacoes.filter(relacao =>
                    String(relacao.idProfessor) === String(idProfessor)
                );

                const aulasPorRelacao = await Promise.all(
                    relacoesProfessor.map(async relacao => {
                        const response = await api.get(`/aula/${relacao.idRelacao}`);
                        return comoLista(response.data).map(aula => ({
                            ...aula,
                            turma: `${relacao.nomeTurma} (${relacao.nomeDisciplina})`
                        }));
                    })
                );
                if (!ativo) return;

                const aulasUnicas = new Map();
                aulasPorRelacao.flat().forEach(aula => {
                    const valorMedia = aula.media_atencao_total;
                    const mediaAtencao = typeof valorMedia === 'number'
                        || (typeof valorMedia === 'string' && valorMedia.trim() !== '')
                        ? Number(valorMedia)
                        : NaN;

                    // Médias ausentes ficam fora do cálculo; uma média de 0% é válida.
                    if (aula.id != null && Number.isFinite(mediaAtencao)) {
                        aulasUnicas.set(String(aula.id), {
                            id: aula.id,
                            data: aula.data,
                            turma: aula.turma,
                            mediaAtencao
                        });
                    }
                });

                const aulas = Array.from(aulasUnicas.values()).sort((a, b) => {
                    const dataA = a.data ? new Date(a.data).getTime() : 0;
                    const dataB = b.data ? new Date(b.data).getTime() : 0;
                    const diferenca = (Number.isFinite(dataA) ? dataA : 0)
                        - (Number.isFinite(dataB) ? dataB : 0);

                    return diferenca || String(a.id).localeCompare(String(b.id), 'pt-BR', { numeric: true });
                });

                setAtencaoProfessor({
                    idProfessor,
                    status: 'pronto',
                    aulas,
                    mediaAtencao: aulas.length > 0
                        ? aulas.reduce((soma, aula) => soma + aula.mediaAtencao, 0) / aulas.length
                        : null
                });
            } catch {
                if (ativo) {
                    setAtencaoProfessor({ idProfessor, status: 'erro', aulas: [], mediaAtencao: null });
                }
            }
        }

        carregarAtencao();

        return () => {
            ativo = false;
        };
    }, [professorSelecionado]);



    // convidar professor
    async function handleAddProfessor() {
        // Se não estava adicionando, apenas exibe o input
        if (!isAddingProfessor) {
            setIsAddingProfessor(true);
            return;
        }

        // Se estava adicionando, verifica se o email foi preenchido
        if (newProfessorEmail.trim() === "") {
            // Se clicar no botão com o input vazio, cancela a ação
            setIsAddingProfessor(false);
            return;
        }

        try {
            await api.post("/instituicao/convidar", { emailProfessor: newProfessorEmail });

            showToast("Convite enviado com sucesso para o email: " + newProfessorEmail, { type: 'success' });

            // Limpa os estados
            setNewProfessorEmail("");
            setIsAddingProfessor(false);

        } catch (error) {
            console.log(error);
            showToast("Erro ao convidar professor: " + (error.response?.data?.message || "Tente novamente."), { type: 'error' });
        }
    }

    function handleRemoveProfessor() {
        const professor = professores[selectedProfessor];
        if (!professor || remocaoEmAndamento.current) return;

        setErroRemocao('');
        setConfirmacaoRemocao({
            id: professor.id,
            titulo: 'Remover professor?',
            mensagem: `Tem certeza que deseja remover o professor ${professor.nome} da instituição?`,
            textoConfirmar: 'Remover professor'
        });
    }

    function cancelarRemocao() {
        if (remocaoEmAndamento.current) return;
        setConfirmacaoRemocao(null);
        setErroRemocao('');
    }

    async function confirmarRemocao() {
        if (!confirmacaoRemocao || remocaoEmAndamento.current) return;
        const alvo = confirmacaoRemocao;
        remocaoEmAndamento.current = true;
        setRemovendo(true);
        setErroRemocao('');

        try {
            await api.delete("/instituicao/removerProfessor", {
                data: { idProfessor: alvo.id }
            });

            setConfirmacaoRemocao(null);
            setSelectedProfessor(null);
            loadData();
            showToast("Professor removido com sucesso!", { type: 'success' });
        } catch (error) {
            console.log(error);
            setErroRemocao("Erro ao remover professor: " + (error.response?.data?.message || "Tente novamente."));
        } finally {
            remocaoEmAndamento.current = false;
            setRemovendo(false);
        }
    }

    return (
        <div className='professores-body'>
            <Header
                routes={[
                    { textButton: "Início", routeButton: "/inicial-instituicao" },
                    { textButton: "Sobre o Projeto", routeButton: "/" },
                    { textButton: "Perfil", routeButton: "/editar-dados" }
                ]} />
            <div className='professores-content'>
                <div className='professores-esquerda'>
                    <p className='professores-esquerda-title'>Lista de professores</p>

                    <div className='professores-list-container'>
                        {professores.map((professor, index) => (
                            <div
                                key={professor.id || index}
                                className={`professor-item ${selectedProfessor === index ? 'selected' : ''}`}
                                onClick={() => setSelectedProfessor(index)}
                            >
                                {professor.nome}
                            </div>
                        ))}

                        {/* Se estiver adicionando, exibe a caixa de input no final da lista */}
                        {isAddingProfessor && (
                            <div className="professor-item">
                                <input
                                    type="email"
                                    placeholder="Digite o e-mail e clique em enviar..."
                                    value={newProfessorEmail}
                                    onChange={(e) => setNewProfessorEmail(e.target.value)}
                                    autoFocus
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleAddProfessor();
                                    }}
                                    style={{
                                        width: '100%',
                                        border: 'none',
                                        outline: 'none',
                                        background: 'transparent',
                                        fontFamily: 'inherit',
                                        fontSize: 'inherit',
                                        color: 'inherit'
                                    }}
                                />
                            </div>
                        )}

                        {professores.length === 0 && !isAddingProfessor && (
                            <p className='professor-selecione'>Nenhum professor encontrado.</p>
                        )}
                    </div>

                    <div>
                        <button className='professores-adicionar' onClick={handleAddProfessor}>
                            {/* Altera o texto do botão dependendo do estado */}
                            <p className='professores-adicionar-text'>
                                {isAddingProfessor ? 'Enviar Convite' : 'Adicionar professor'}
                            </p>
                        </button>
                    </div>
                </div>

                <div className='professores-direita'>
                    <p className='professores-direita-title'>
                        {professores[selectedProfessor]?.nome || 'Detalhes do professor'}
                    </p>

                    <div>
                        {selectedProfessor !== null && professores[selectedProfessor] ? (
                            <div className='professor-detalhes'>
                                <p><strong>Email:</strong> {professores[selectedProfessor].email}</p>
                                <p><strong>Turmas:</strong> {professores[selectedProfessor].turmas.join(', ') || 'Nenhuma'}</p>
                                <p>
                                    <strong>Média de Atenção:</strong>{' '}
                                    {statusAtencao === 'carregando' ? 'Carregando...'
                                        : statusAtencao === 'erro' ? 'Indisponível'
                                        : dadosAtencao?.mediaAtencao != null
                                        ? `${dadosAtencao.mediaAtencao.toLocaleString('pt-BR', {
                                            minimumFractionDigits: 1,
                                            maximumFractionDigits: 1
                                        })}%`
                                        : 'Sem análises'}
                                </p>
                            </div>
                        ) : (
                            <p className='professor-selecione'>Selecione um professor para ver os detalhes</p>
                        )}
                    </div>

                    <div className='professores-historico-aulas-content' aria-busy={statusAtencao === 'carregando'}>
                        {professorSelecionado ? (
                            statusAtencao === 'carregando' ? (
                                <p className='professores-grafico-mensagem' role="status">Carregando atenção das aulas...</p>
                            ) : statusAtencao === 'erro' ? (
                                <p className='professores-grafico-mensagem' role="alert">Não foi possível carregar os dados de atenção deste professor.</p>
                            ) : dadosGrafico.length > 0 ? (
                                <>
                                    <p className='professores-grafico-title'>Atenção média por aula</p>
                                    <GenericLineChart
                                        data={dadosGrafico}
                                        xKey="aula"
                                        yKey="mediaAtencao"
                                        lines={[{ key: 'mediaAtencao', label: 'Atenção média (%)', color: '#4F46E5' }]}
                                        formatXAxis={rotulo => rotulo.split(' - ')[0]}
                                        height={230}
                                        isAnimationActive={false}
                                    />
                                </>
                            ) : (
                                <p className='professores-grafico-mensagem'>Nenhuma aula com atenção registrada para este professor.</p>
                            )
                        ) : (
                            <p className='professores-grafico-mensagem'>Selecione um professor para visualizar o gráfico.</p>
                        )}
                    </div>

                    {/* Exibe o botão de remover apenas se houver um professor selecionado */}
                    {selectedProfessor !== null && (
                        <button className='professores-remover' onClick={handleRemoveProfessor}>
                            <p className='professores-remover-text'>Remover professor</p>
                        </button>
                    )}
                </div>
            </div>
            <ConfirmPopup
                isOpen={confirmacaoRemocao !== null}
                title={confirmacaoRemocao?.titulo}
                message={confirmacaoRemocao?.mensagem || ''}
                confirmText={confirmacaoRemocao?.textoConfirmar}
                onConfirm={confirmarRemocao}
                onCancel={cancelarRemocao}
                isLoading={removendo}
                errorMessage={erroRemocao}
            />
        </div>
    );
}
