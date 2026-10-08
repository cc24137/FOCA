import Header from '../../components/header';
import ConfirmPopup from '../../components/confirm-popup';
import GenericLineChart from '../../components/time-vs-value-chart';
import './disciplinas.css';
import { useState, useEffect, useRef } from 'react';
import api from "../../services/api";

export default function Disciplinas() {
    const [disciplinas, setDisciplinas] = useState([]);
    const [selectedDisciplina, setSelectedDisciplina] = useState(null);
    const [atencaoDisciplina, setAtencaoDisciplina] = useState(null);
    const cacheVinculos = useRef(new Map());
    const [confirmacaoRemocao, setConfirmacaoRemocao] = useState(null);
    const [removendo, setRemovendo] = useState(false);
    const [erroRemocao, setErroRemocao] = useState('');
    const remocaoEmAndamento = useRef(false);

    // Estados para edição
    const [isEditing, setIsEditing] = useState(false);
    const [nomeDisciplina, setNomeDisciplina] = useState('');

    // Estados para adição
    const [isAdding, setIsAdding] = useState(false);
    const [newDisciplinaName, setNewDisciplinaName] = useState('');

    const disciplinaSelecionada = disciplinas[selectedDisciplina];
    const nomeRepetido = disciplinaSelecionada && disciplinas.some(disciplina =>
        String(disciplina.id) !== String(disciplinaSelecionada.id)
        && disciplina.nome === disciplinaSelecionada.nome
    );
    const dadosAtencao = disciplinaSelecionada && atencaoDisciplina
        && String(atencaoDisciplina.idDisciplina) === String(disciplinaSelecionada.id)
        && atencaoDisciplina.nomeDisciplina === disciplinaSelecionada.nome
        ? atencaoDisciplina
        : null;
    const statusAtencao = dadosAtencao?.status || (disciplinaSelecionada ? 'carregando' : 'vazio');
    const mediaFormatada = statusAtencao === 'carregando' ? 'Carregando...'
        : statusAtencao === 'erro' || statusAtencao === 'ambiguo' ? 'Indisponível'
        : dadosAtencao?.mediaAtencao != null
        ? `${dadosAtencao.mediaAtencao.toLocaleString('pt-BR', {
            minimumFractionDigits: 1,
            maximumFractionDigits: 1
        })}%`
        : 'Sem análises';
    const turmasFormatadas = dadosAtencao?.turmas?.length > 0
        ? dadosAtencao.turmas.join(', ')
        : statusAtencao === 'carregando' ? 'Carregando...'
        : statusAtencao === 'erro' || statusAtencao === 'ambiguo' ? 'Indisponível'
        : 'Nenhum vínculo';
    const dadosGrafico = (dadosAtencao?.aulas || []).map((aula, index) => {
        const data = aula.data ? new Date(aula.data) : null;
        const dataFormatada = data && !Number.isNaN(data.getTime())
            ? data.toLocaleDateString('pt-BR', { timeZone: 'UTC' })
            : 'Data não informada';

        return {
            aula: `Aula ${index + 1} - ${dataFormatada} - ${aula.turma || 'Turma não informada'} (${aula.professor || 'Professor não informado'})`,
            mediaAtencao: Number(aula.mediaAtencao.toFixed(2))
        };
    });

    // Carregar os dados ao entrar na tela
    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        let ativo = true;

        if (!disciplinaSelecionada) {
            setAtencaoDisciplina(null);
            return;
        }

        const idDisciplina = disciplinaSelecionada.id;
        const nomeDisciplina = disciplinaSelecionada.nome;
        const dadosIniciais = { idDisciplina, nomeDisciplina, turmas: [], aulas: [], mediaAtencao: null };

        // Os vínculos retornam o nome da disciplina, sem seu ID.
        if (nomeRepetido) {
            setAtencaoDisciplina({ ...dadosIniciais, status: 'ambiguo' });
            return;
        }

        setAtencaoDisciplina({ ...dadosIniciais, status: 'carregando' });

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
            let turmas = [];

            try {
                const dataTurmas = await consultarVinculos('/turmas/infosPorInstituicao');
                if (!ativo) return;

                const turmasUnicas = new Map();
                comoLista(dataTurmas).forEach(turma => {
                    if (turma.id != null) turmasUnicas.set(String(turma.id), turma);
                });

                const relacoesPorTurma = await Promise.all(
                    Array.from(turmasUnicas.values()).map(async turma => {
                        const data = await consultarVinculos('/turmaRelacao/porTurma', { idTurma: turma.id });
                        return comoLista(data)
                            .filter(relacao => relacao.id != null && relacao.nomeDisciplina === nomeDisciplina)
                            .map(relacao => ({ ...relacao, turma: turma.nome }));
                    })
                );
                if (!ativo) return;

                const relacoesUnicas = new Map();
                relacoesPorTurma.flat().forEach(relacao => {
                    relacoesUnicas.set(String(relacao.id), relacao);
                });
                const relacoes = Array.from(relacoesUnicas.values());
                turmas = Array.from(new Set(relacoes.map(relacao =>
                    `${relacao.turma || 'Turma não informada'} (${relacao.nomeProfessor || 'Professor não informado'})`
                )));
                setAtencaoDisciplina({ ...dadosIniciais, status: 'carregando', turmas });

                const aulasPorRelacao = await Promise.all(
                    relacoes.map(async relacao => {
                        const response = await api.get(`/aula/${relacao.id}`);
                        return comoLista(response.data).map(aula => ({
                            ...aula,
                            turma: relacao.turma,
                            professor: relacao.nomeProfessor
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

                    // Uma média de 0% é válida; valores ausentes ficam fora do cálculo.
                    if (aula.id != null && Number.isFinite(mediaAtencao)) {
                        aulasUnicas.set(String(aula.id), {
                            id: aula.id,
                            data: aula.data,
                            turma: aula.turma,
                            professor: aula.professor,
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

                setAtencaoDisciplina({
                    idDisciplina,
                    nomeDisciplina,
                    status: 'pronto',
                    turmas,
                    aulas,
                    mediaAtencao: aulas.length > 0
                        ? aulas.reduce((soma, aula) => soma + aula.mediaAtencao, 0) / aulas.length
                        : null
                });
            } catch {
                if (ativo) {
                    setAtencaoDisciplina({ ...dadosIniciais, status: 'erro', turmas });
                }
            }
        }

        carregarAtencao();

        return () => {
            ativo = false;
        };
    }, [disciplinaSelecionada, nomeRepetido]);

    async function loadData() {
        try {
            cacheVinculos.current.clear();
            const response = await api.get("/disciplinas/porInstituicao");

            const data = response.data;
            const disciplinasAgrupadas = [];

            data.forEach(disc => {
                if (!disciplinasAgrupadas.some(e => String(e.id) === String(disc.id))) {
                    disciplinasAgrupadas.push({
                        id: disc.id,
                        nome: disc.nome
                    });
                }
            });

            setDisciplinas(disciplinasAgrupadas);
        } catch (error) {
            console.log(error);
            alert("Erro ao carregar disciplinas.");
        }
    }

    // --- LÓGICA DE ADICIONAR ---
    async function handleAddDisciplina() {
        if (!isAdding) {
            setIsAdding(true);
            return;
        }

        if (newDisciplinaName.trim() === "") {
            setIsAdding(false);
            return;
        }

        try {
            // O backend espera { name } no body
            await api.post("/disciplinas/cadastrar", { name: newDisciplinaName });

            alert("Disciplina adicionada com sucesso!");
            setNewDisciplinaName("");
            setIsAdding(false);
            loadData(); // Recarrega a lista
        } catch (error) {
            console.log(error);
            alert("Erro ao adicionar disciplina.");
        }
    }

    // --- LÓGICA DE EDITAR ---
    async function handleEditDisciplina() {
        if (selectedDisciplina === null) return;

        const disc = disciplinas[selectedDisciplina];

        // Se NÃO estiver editando, entra em modo de edição e preenche o input
        if (!isEditing) {
            setNomeDisciplina(disc.nome);
            setIsEditing(true);
        } else {
            // Se JÁ estiver editando e clicou em salvar
            if (nomeDisciplina.trim() === "" || nomeDisciplina === disc.nome) {
                setIsEditing(false);
                return;
            }

            try {
                // O backend espera { id, name } no body
                await api.put("/disciplinas/atualizar", {
                    id: disc.id,
                    name: nomeDisciplina
                });

                alert("Disciplina atualizada com sucesso!");
                setIsEditing(false);
                loadData(); // Atualiza a lista do banco
            } catch (error) {
                console.log(error);
                alert("Erro ao atualizar disciplina.");
            }
        }
    }

    function handleRemoveDisciplina() {
        const disciplina = disciplinas[selectedDisciplina];
        if (!disciplina || remocaoEmAndamento.current) return;

        setErroRemocao('');
        setConfirmacaoRemocao({
            id: disciplina.id,
            titulo: 'Remover disciplina?',
            mensagem: `Tem certeza que deseja remover a disciplina ${disciplina.nome}?`,
            textoConfirmar: 'Remover disciplina'
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
            await api.delete("/disciplinas/excluir", {
                data: { id: alvo.id }
            });

            setConfirmacaoRemocao(null);
            setSelectedDisciplina(null);
            setIsEditing(false);
            loadData();
            alert("Disciplina removida com sucesso!");
        } catch (error) {
            console.log(error);
            setErroRemocao("Erro ao remover disciplina. Tente novamente.");
        } finally {
            remocaoEmAndamento.current = false;
            setRemovendo(false);
        }
    }

    return (
        <div className='disciplinas-body'>
            <Header
                routes={[
                    { textButton: "Início", routeButton: "/inicial-instituicao" },
                    { textButton: "Sobre o Projeto", routeButton: "/" },
                    { textButton: "Perfil", routeButton: "/editar-dados" }
                ]} />
            <div className='disciplinas-content'>
                <div className='disciplinas-esquerda'>
                    <p className='disciplinas-esquerda-title'>Lista de disciplinas</p>

                    <div className='disciplinas-list-container'>
                        {disciplinas.map((disciplina, index) => (
                            <div
                                key={disciplina.id || index}
                                className={`disciplina-item ${selectedDisciplina === index ? 'selected' : ''}`}
                                onClick={() => {
                                    setSelectedDisciplina(index);
                                    setIsEditing(false); // Sai do modo edição se clicar em outra
                                }}
                            >
                                {disciplina.nome}
                            </div>
                        ))}

                        {/* Input para adicionar nova disciplina */}
                        {isAdding && (
                            <div className="disciplina-item">
                                <input
                                    type="text"
                                    placeholder="Nome da disciplina..."
                                    value={newDisciplinaName}
                                    onChange={(e) => setNewDisciplinaName(e.target.value)}
                                    autoFocus
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleAddDisciplina();
                                    }}
                                    style={{
                                        width: '100%', border: 'none', outline: 'none',
                                        background: 'transparent', fontFamily: 'inherit',
                                        fontSize: 'inherit', color: 'inherit'
                                    }}
                                />
                            </div>
                        )}

                        {disciplinas.length === 0 && !isAdding && (
                            <p className='disciplina-selecione'>Nenhuma disciplina encontrada.</p>
                        )}
                    </div>

                    <div>
                        <button className='disciplinas-adicionar' onClick={handleAddDisciplina}>
                            <p className='disciplinas-adicionar-text'>
                                {isAdding ? 'Salvar Disciplina' : 'Adicionar disciplina'}
                            </p>
                        </button>
                    </div>
                </div>

                <div className='disciplinas-direita'>
                    {isEditing ? (
                        <input
                            className='disciplinas-direita-title-input'
                            value={nomeDisciplina}
                            onChange={(e) => setNomeDisciplina(e.target.value)}
                            autoFocus
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleEditDisciplina();
                            }}
                        />
                    ) : (
                        <p className='disciplinas-direita-title'>
                            {disciplinas[selectedDisciplina]?.nome || 'Detalhes da disciplina'}
                        </p>
                    )}

                    <div>
                        {selectedDisciplina !== null && disciplinas[selectedDisciplina] ? (
                            <div className='disciplina-detalhes'>
                                <p><strong>Turmas e Professores:</strong> {turmasFormatadas}</p>
                                <p><strong>Média de Atenção:</strong> {mediaFormatada}</p>
                            </div>
                        ) : (
                            <p className='disciplina-selecione'>Selecione uma disciplina para ver os detalhes</p>
                        )}
                    </div>

                    <div className='disciplinas-historico-aulas-content' aria-busy={statusAtencao === 'carregando'}>
                        {disciplinaSelecionada ? (
                            statusAtencao === 'carregando' ? (
                                <p className='disciplinas-grafico-mensagem' role="status">Carregando atenção das aulas...</p>
                            ) : statusAtencao === 'ambiguo' ? (
                                <p className='disciplinas-grafico-mensagem' role="alert">Há disciplinas com o mesmo nome. Renomeie uma delas para consultar a atenção.</p>
                            ) : statusAtencao === 'erro' ? (
                                <p className='disciplinas-grafico-mensagem' role="alert">Não foi possível carregar os dados de atenção desta disciplina.</p>
                            ) : dadosGrafico.length > 0 ? (
                                <>
                                    <p className='disciplinas-grafico-title'>Atenção média por aula</p>
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
                                <p className='disciplinas-grafico-mensagem'>Nenhuma aula com atenção registrada para esta disciplina.</p>
                            )
                        ) : (
                            <p className='disciplinas-grafico-mensagem'>Selecione uma disciplina para visualizar o gráfico.</p>
                        )}
                    </div>

                    {/* Botões de Ação só aparecem se uma disciplina estiver selecionada */}
                    {selectedDisciplina !== null && (
                        <div className='disciplinas-row'>
                            <button
                                className='disciplinas-editar'
                                onClick={handleEditDisciplina}
                            >
                                <p className='disciplinas-editar-text'>{isEditing ? "Salvar" : "Editar disciplina"}</p>
                            </button>

                            <button className='disciplinas-remover' onClick={handleRemoveDisciplina}>
                                <p className='disciplinas-remover-text'>Remover disciplina</p>
                            </button>
                        </div>
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
