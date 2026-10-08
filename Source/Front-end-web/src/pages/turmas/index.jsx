import { useState, useRef, useEffect } from 'react';
import Header from '../../components/header';
import ConfirmPopup from '../../components/confirm-popup';
import Combobox from '../../components/combobox-turmas'
import GenericLineChart from '../../components/time-vs-value-chart';
import './turmas.css';
import api from "../../services/api";

export default function Turmas(){
    const [turmas, setTurma] = useState([]);
    const [isEditing, setIsEditing] = useState(false);
    const [selectedTurma, setSelectedTurma] = useState(null);

    // Armazena as relações (Professor/Disciplina) da turma selecionada
    const [relacoes, setRelacoes] = useState([]);
    const [atencaoTurma, setAtencaoTurma] = useState(null);
    const consultaAtual = useRef({ idTurma: null, versao: 0 });
    const [confirmacaoRemocao, setConfirmacaoRemocao] = useState(null);
    const [removendo, setRemovendo] = useState(false);
    const [erroRemocao, setErroRemocao] = useState('');
    const remocaoEmAndamento = useRef(false);

    // Estados para armazenar os dados reais vindos da API para as caixas de seleção
    const [allProfessores, setAllProfessores] = useState([]);
    const [allDisciplinas, setAllDisciplinas] = useState([]);

    // Estados para edição dos campos da turma
    const [nameTurma, setNameTurma] = useState('');
    const [serieTurma, setSerieTurma] = useState('');
    const [alunosTurma, setAlunosTurma] = useState(0);

    // Estados para a criação de uma nova turma
    const [isAdding, setIsAdding] = useState(false);
    const [newTurmaName, setNewTurmaName] = useState('');

    const [addingProf, setAddingProf] = useState(false);
    const [newProf, setNewProf] = useState({ nome: '', disciplina: '' });

    const turmaSelecionada = turmas[selectedTurma];
    const dadosAtencao = turmaSelecionada && atencaoTurma
        && String(atencaoTurma.idTurma) === String(turmaSelecionada.id)
        ? atencaoTurma
        : null;
    const statusAtencao = dadosAtencao?.status || (turmaSelecionada ? 'carregando' : 'vazio');
    const mediaFormatada = statusAtencao === 'carregando' ? 'Carregando...'
        : statusAtencao === 'erro' ? 'Indisponível'
        : dadosAtencao?.mediaAtencao != null
        ? `${dadosAtencao.mediaAtencao.toLocaleString('pt-BR', {
            minimumFractionDigits: 1,
            maximumFractionDigits: 1
        })}%`
        : 'Sem análises';
    const dadosGrafico = (dadosAtencao?.aulas || []).map((aula, index) => {
        const data = aula.data ? new Date(aula.data) : null;
        const dataFormatada = data && !Number.isNaN(data.getTime())
            ? data.toLocaleDateString('pt-BR', { timeZone: 'UTC' })
            : 'Data não informada';

        return {
            aula: `Aula ${index + 1} - ${dataFormatada} - ${aula.disciplina || 'Disciplina não informada'} (${aula.professor || 'Professor não informado'})`,
            mediaAtencao: Number(aula.mediaAtencao.toFixed(2))
        };
    });

    // Carrega as turmas, professores e disciplinas ao montar a tela
    useEffect(() => {
        loadData();
    }, []);

    // Atualiza as relações sempre que a turma selecionada mudar
    useEffect(() => {
        consultaAtual.current.idTurma = turmaSelecionada?.id ?? null;

        if (turmaSelecionada) {
            loadRelacoes(turmaSelecionada.id);
        } else {
            consultaAtual.current.versao++;
            setRelacoes([]);
            setAtencaoTurma(null);
        }

        return () => {
            consultaAtual.current.versao++;
            consultaAtual.current.idTurma = null;
        };
    }, [turmaSelecionada]);

    async function loadData() {
        try {
            const [turmasRes, disciplinasRes, professoresRes] = await Promise.all([
                api.get("/turmas/infosPorInstituicao"),
                api.get("/disciplinas/porInstituicao"),
                api.get("/professor/infosPorInstituicao")
            ]);

            const dataTurmas = turmasRes.data;
            const deAgrupado = [];

            dataTurmas.forEach(row => {
                let turma = deAgrupado.find(t => t.id === row.id);
                if (!turma) {
                    turma = {
                        id: row.id,
                        nome: row.nome,
                        numeroAlunos: row.numero_alunos || 0,
                        serie: row.serie || ''
                    };
                    deAgrupado.push(turma);
                }
            });
            setTurma(deAgrupado);
            setAllDisciplinas(disciplinasRes.data);

            const profsUnicos = [];
            professoresRes.data.forEach(p => {
                if (!profsUnicos.some(up => up.id === p.id)) {
                    profsUnicos.push({ id: p.id, nome: p.nome });
                }
            });
            setAllProfessores(profsUnicos);

        } catch (error) {
            console.error("Erro ao carregar dados do banco:", error);
            alert("Não foi possível carregar as informações da instituição.");
        }
    }

    // Busca os vínculos e as médias das aulas da turma pelas rotas existentes.
    async function loadRelacoes(idTurma) {
        if (String(consultaAtual.current.idTurma) !== String(idTurma)) return;

        const versao = ++consultaAtual.current.versao;
        const estaAtual = () => versao === consultaAtual.current.versao
            && String(consultaAtual.current.idTurma) === String(idTurma);
        const comoLista = data => Array.isArray(data) ? data : (data ? [data] : []);

        setRelacoes([]);
        setAtencaoTurma({ idTurma, status: 'carregando', aulas: [], mediaAtencao: null });

        try {
            const response = await api.get("/turmaRelacao/porTurma", {
                params: { idTurma: idTurma }
            });
            if (!estaAtual()) return;

            const novasRelacoes = comoLista(response.data);
            setRelacoes(novasRelacoes);

            const relacoesUnicas = new Map();
            novasRelacoes.forEach(relacao => {
                if (relacao.id != null) relacoesUnicas.set(String(relacao.id), relacao);
            });

            const aulasPorRelacao = await Promise.all(
                Array.from(relacoesUnicas.values()).map(async relacao => {
                    const resAulas = await api.get(`/aula/${relacao.id}`);
                    return comoLista(resAulas.data).map(aula => ({
                        ...aula,
                        professor: relacao.nomeProfessor,
                        disciplina: relacao.nomeDisciplina
                    }));
                })
            );
            if (!estaAtual()) return;

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
                        professor: aula.professor,
                        disciplina: aula.disciplina,
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

            setAtencaoTurma({
                idTurma,
                status: 'pronto',
                aulas,
                mediaAtencao: aulas.length > 0
                    ? aulas.reduce((soma, aula) => soma + aula.mediaAtencao, 0) / aulas.length
                    : null
            });
        } catch {
            if (estaAtual()) {
                setAtencaoTurma({ idTurma, status: 'erro', aulas: [], mediaAtencao: null });
            }
        }
    }

    async function edit_clicked(){
        if(selectedTurma != null){
            const turmaAtual = turmas[selectedTurma];
            if(!isEditing){
                setNameTurma(turmaAtual.nome);
                setSerieTurma(turmaAtual.serie);
                setAlunosTurma(turmaAtual.numeroAlunos);
                setIsEditing(true);
            } else {
                if(nameTurma.trim() === "") return;

                try {
                    await api.put("/turmas/atualizar", {
                        id: turmaAtual.id,
                        name: nameTurma,
                        studentCount: Number(alunosTurma),
                        grade: serieTurma
                    });

                    alert("Turma atualizada com sucesso!");
                    setIsEditing(false);
                    loadData();
                } catch (error) {
                    console.error("Erro ao atualizar turma:", error);
                    alert("Erro ao salvar as alterações da turma.");
                }
            }
        }
    }

    async function handleAddTurma() {
        if (!isAdding) {
            setIsAdding(true);
            return;
        }

        if (newTurmaName.trim() === "") {
            setIsAdding(false);
            return;
        }

        try {
            await api.post("/turmas/cadastrar", {
                name: newTurmaName,
                studentCount: 0,
                grade: ""
            });

            alert("Turma adicionada com sucesso!");
            setNewTurmaName("");
            setIsAdding(false);
            loadData();
        } catch (error) {
            console.error("Erro ao cadastrar turma:", error);
            alert("Erro ao adicionar a nova turma.");
        }
    }

    function handleRemoveRelacao(idRelacao) {
        const turma = turmas[selectedTurma];
        const relacao = relacoes.find(item => String(item.id) === String(idRelacao));
        if (!turma || !relacao || remocaoEmAndamento.current) return;

        setErroRemocao('');
        setConfirmacaoRemocao({
            tipo: 'relacao',
            id: relacao.id,
            idTurma: turma.id,
            titulo: 'Remover vínculo?',
            mensagem: `Deseja remover o vínculo de ${relacao.nomeProfessor} com a disciplina ${relacao.nomeDisciplina} na turma ${turma.nome}?`,
            textoConfirmar: 'Remover vínculo'
        });
    }

    function handleRemoveTurma() {
        const turma = turmas[selectedTurma];
        if (!turma || remocaoEmAndamento.current) return;

        setErroRemocao('');
        setConfirmacaoRemocao({
            tipo: 'turma',
            id: turma.id,
            titulo: 'Remover turma?',
            mensagem: `Tem certeza que deseja remover a turma ${turma.nome}?`,
            textoConfirmar: 'Remover turma'
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
            if (alvo.tipo === 'relacao') {
                await api.delete("/turmaRelacao/excluir", {
                    data: { id: alvo.id }
                });
                setConfirmacaoRemocao(null);
                loadRelacoes(alvo.idTurma);
            } else {
                await api.delete("/turmas/excluir", {
                    data: { id: alvo.id }
                });
                setConfirmacaoRemocao(null);
                setSelectedTurma(null);
                setIsEditing(false);
                loadData();
                alert("Turma removida com sucesso!");
            }
        } catch (error) {
            console.error("Erro ao remover:", error);
            setErroRemocao(alvo.tipo === 'relacao'
                ? "Não foi possível remover o vínculo desta turma. Tente novamente."
                : "Não foi possível remover esta turma. Tente novamente.");
        } finally {
            remocaoEmAndamento.current = false;
            setRemovendo(false);
        }
    }

    // Função para criar o vínculo definitivo na tabela de relação
    async function confirmAddProf() {
        if (!newProf.nome || !newProf.disciplina) return;

        const professorEncontrado = allProfessores.find(p => p.nome === newProf.nome);
        const disciplinaEncontrada = allDisciplinas.find(d => d.nome === newProf.disciplina);
        const turmaAtual = turmas[selectedTurma];

        if (!professorEncontrado || !disciplinaEncontrada) {
            alert("Selecione um professor e uma disciplina válidos.");
            return;
        }

        try {
            await api.post("/turmaRelacao/relacionar", {
                idDisciplina: disciplinaEncontrada.id,
                idTurma: turmaAtual.id,
                idProfessor: professorEncontrado.id
            });

            alert("Vínculo criado com sucesso!");
            setNewProf({ nome: '', disciplina: '' });
            setAddingProf(false);

            // Recarrega somente a tabela de vínculos após inserir
            loadRelacoes(turmaAtual.id);
        } catch (error) {
            console.error("Erro ao criar vínculo de turma/professor/disciplina:", error);
            alert("Não foi possível criar a relação. Verifique as configurações do servidor.");
        }
    }

    return (
        <div className='turmas-body'>
            <Header
                routes={[
                    { textButton: "Início", routeButton: "/inicial-instituicao" },
                    { textButton: "Sobre o Projeto", routeButton: "/" },
                    { textButton: "Perfil", routeButton: "/editar-dados" }
                ]} />
            <div className='turmas-content'>
                <div className='turmas-esquerda'>
                    <p className='turmas-esquerda-title'>Lista de turmas</p>

                    <div className='turmas-list-container'>
                        {turmas.map((turma, index) => (
                            <div
                                key={turma.id || index}
                                className={`turma-item ${selectedTurma === index ? 'selected' : ''}`}
                                onClick={() => {
                                    setSelectedTurma(index);
                                    setIsEditing(false);
                                }}
                            >
                                {turma.nome}
                            </div>
                        ))}

                        {isAdding && (
                            <div className="turma-item">
                                <input
                                    type="text"
                                    placeholder="Nome da nova turma..."
                                    value={newTurmaName}
                                    onChange={(e) => setNewTurmaName(e.target.value)}
                                    autoFocus
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleAddTurma();
                                    }}
                                    style={{
                                        width: '100%', border: 'none', outline: 'none',
                                        background: 'transparent', fontFamily: 'inherit',
                                        fontSize: 'inherit', color: 'inherit'
                                    }}
                                />
                            </div>
                        )}
                    </div>

                    <div>
                        <button className='turmas-adicionar' onClick={handleAddTurma}>
                            <p className='turmas-adicionar-text'>
                                {isAdding ? 'Salvar Turma' : 'Adicionar turma'}
                            </p>
                        </button>
                    </div>
                </div>

                <div className='turmas-direita'>
                        {isEditing ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
                                <label style={{ fontFamily: 'var(--font-inter)', fontSize: '14px' }}><strong>Nome da Turma:</strong></label>
                                <input
                                    className='turmas-direita-title-input'
                                    value={nameTurma || ''}
                                    onChange={(e) => setNameTurma(e.target.value)}
                                />

                                <label style={{ fontFamily: 'var(--font-inter)', fontSize: '14px' }}><strong>Série / Grau:</strong></label>
                                <input
                                    className='turmas-direita-title-input'
                                    value={serieTurma || ''}
                                    onChange={(e) => setSerieTurma(e.target.value)}
                                    placeholder="Ex: 9º Ano, 3º Colegial"
                                />

                                <label style={{ fontFamily: 'var(--font-inter)', fontSize: '14px' }}><strong>Quantidade de Alunos:</strong></label>
                                <input
                                    type="number"
                                    min = "0"
                                    className='turmas-direita-title-input'
                                    value={alunosTurma}
                                    onChange={(e) => setAlunosTurma(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') edit_clicked();
                                    }}
                                />
                            </div>
                        ) : (
                            <p className='turmas-direita-title'>
                                {turmas[selectedTurma]?.nome || 'Detalhes da turma'}
                            </p>
                        )}

                    <div>
                        {selectedTurma !== null ? (
                            <div className='turma-detalhes'>
                                {!isEditing && (
                                    <>
                                        <p><strong>Série:</strong> {turmas[selectedTurma].serie || 'Não informada'}</p>
                                        <p><strong>Alunos:</strong> {turmas[selectedTurma].numeroAlunos}</p>
                                        <p><strong>Média de Atenção:</strong> {mediaFormatada}</p>
                                    </>
                                )}

                                <table className='turma-professores-tabela'>
                                    <thead>
                                        <tr>
                                            <th>Professor</th>
                                            <th>Disciplina</th>
                                            <th>
                                                <button
                                                    className='turma-prof-adicionar'
                                                    onClick={() => { setAddingProf(true); setNewProf({ nome: '', disciplina: '' }); }}
                                                    title="Adicionar relação"
                                                >+</button>
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {/* Agora iterando pelo estado de relações baixado via GET */}
                                        {relacoes.map((rel, i) => (
                                            <tr key={i}>
                                                <td>{rel.nomeProfessor}</td>
                                                <td>{rel.nomeDisciplina}</td>
                                                <td>
                                                    <button
                                                        className='turma-prof-remover'
                                                        // Passamos o ID respectivo da relação para a requisição
                                                        onClick={() => handleRemoveRelacao(rel.id)}
                                                        title="Remover relação"
                                                    >✕</button>
                                                </td>
                                            </tr>
                                        ))}
                                        {addingProf && (
                                            <tr className='turma-prof-nova-linha'>
                                                <td>
                                                    <Combobox
                                                        options={allProfessores.map(p => p.nome)}
                                                        value={newProf.nome}
                                                        onChange={v => setNewProf(p => ({ ...p, nome: v }))}
                                                        placeholder="Escolha o Professor..."
                                                    />
                                                </td>
                                                <td>
                                                    <Combobox
                                                        options={allDisciplinas.map(d => d.nome)}
                                                        value={newProf.disciplina}
                                                        onChange={v => setNewProf(p => ({ ...p, disciplina: v }))}
                                                        placeholder="Escolha a Disciplina..."
                                                    />
                                                </td>
                                                <td className='turma-prof-nova-acoes'>
                                                    <button className='turma-prof-remover' onClick={() => setAddingProf(false)} title="Cancelar">✕</button>
                                                    <button className='turma-prof-confirmar' onClick={confirmAddProf} title="Confirmar Vínculo">✓</button>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <p className='turma-selecione'>Selecione uma turma para ver os detalhes</p>
                        )}
                    </div>

                    <div className='turmas-historico-aulas-content' aria-busy={statusAtencao === 'carregando'}>
                        {turmaSelecionada ? (
                            statusAtencao === 'carregando' ? (
                                <p className='turmas-grafico-mensagem' role="status">Carregando atenção das aulas...</p>
                            ) : statusAtencao === 'erro' ? (
                                <p className='turmas-grafico-mensagem' role="alert">Não foi possível carregar os dados de atenção desta turma.</p>
                            ) : dadosGrafico.length > 0 ? (
                                <>
                                    <p className='turmas-grafico-title'>Atenção média por aula</p>
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
                                <p className='turmas-grafico-mensagem'>Nenhuma aula com atenção registrada para esta turma.</p>
                            )
                        ) : (
                            <p className='turmas-grafico-mensagem'>Selecione uma turma para visualizar o gráfico.</p>
                        )}
                    </div>

                    <div className='turmas-row'>
                        <button
                            className='turmas-editar'
                            onClick={edit_clicked}
                        >
                            <p className='turmas-editar-text'>{isEditing ? "Salvar": "Editar turma"}</p>
                        </button>

                        <button className='turmas-remover' onClick={handleRemoveTurma}>
                            <p className='turmas-remover-text'>Remover turma</p>
                        </button>
                    </div>

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
    )
}
