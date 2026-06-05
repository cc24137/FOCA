import { useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import Header from '../../components/header';
import Combobox from '../../components/combobox-turmas'
import './turmas.css'
import api from "../../services/api";

export default function Turmas(){
    const [turmas, setTurma] = useState([]);
    const [isEditing, setIsEditing] = useState(false);
    const [selectedTurma, setSelectedTurma] = useState(null);

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

    // Carrega as turmas, professores e disciplinas ao montar a tela
    useEffect(() => {
        loadData();
    }, []);

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
                        serie: row.serie || '',
                        professores: []
                    };
                    deAgrupado.push(turma);
                }

                if (row.professor && row.disciplina) {
                    const jaExiste = turma.professores.some(p => p.nome === row.professor && p.disciplina === row.disciplina);
                    if (!jaExiste) {
                        turma.professores.push({
                            nome: row.professor,
                            disciplina: row.disciplina
                        });
                    }
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

    async function handleRemoveTurma() {
        if (selectedTurma === null) return;

        const turma = turmas[selectedTurma];
        const confirmacao = window.confirm(`Tem certeza que deseja remover a turma ${turma.nome}?`);

        if (confirmacao) {
            try {
                await api.delete("/turmas/excluir", {
                    data: { id: turma.id }
                });

                alert("Turma removida com sucesso!");
                setSelectedTurma(null);
                setIsEditing(false);
                loadData();
            } catch (error) {
                console.error("Erro ao remover turma:", error);
                alert("Não foi possível remover esta turma.");
            }
        }
    }

    // Função para criar o vínculo definitivo na tabela de relação
    async function confirmAddProf() {
        if (!newProf.nome || !newProf.disciplina) return;

        // Procura os IDs corretos com base no nome selecionado nas caixas de texto
        const professorEncontrado = allProfessores.find(p => p.nome === newProf.nome);
        const disciplinaEncontrada = allDisciplinas.find(d => d.nome === newProf.disciplina);
        const turmaAtual = turmas[selectedTurma];

        if (!professorEncontrado || !disciplinaEncontrada) {
            alert("Selecione um professor e uma disciplina válidos.");
            return;
        }

        try {
            await api.post("/turmaRelacao/cadastrar", {
                idDisciplina: disciplinaEncontrada.id,
                idTurma: turmaAtual.id,
                idProfessor: professorEncontrado.id
            });

            alert("Vínculo criado com sucesso!");
            setNewProf({ nome: '', disciplina: '' });
            setAddingProf(false);
            loadData(); // Atualiza a tabela com o novo registro vindo do banco
        } catch (error) {
            console.error("Erro ao criar vínculo de turma/professor/disciplina:", error);
            alert("Não foi possível criar a relação. Verifique as configurações do servidor.");
        }
    }

    return (
        <div className='turmas-body'>
            <Header />
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
                                        {turmas[selectedTurma].professores.map((prof, i) => (
                                            <tr key={i}>
                                                <td>{prof.nome}</td>
                                                <td>{prof.disciplina}</td>
                                                <td>
                                                    {/* Mantida a remoção visual enquanto você define uma rota de exclusão de relação se achar necessário */}
                                                    <button
                                                        className='turma-prof-remover'
                                                        onClick={() => setTurma(prev => prev.map((t, ti) =>
                                                            ti === selectedTurma
                                                                ? { ...t, profesores: t.professores.filter((_, pi) => pi !== i) }
                                                                : t
                                                        ))}
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

                    <div className='turmas-historico-aulas-content'>

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
        </div>
    )
}
