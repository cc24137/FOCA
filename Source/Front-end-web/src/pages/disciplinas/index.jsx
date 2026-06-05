import Header from '../../components/header';
import './disciplinas.css';
import { useState, useEffect } from 'react';
import api from "../../services/api";

export default function Disciplinas() {
    const [disciplinas, setDisciplinas] = useState([]);
    const [selectedDisciplina, setSelectedDisciplina] = useState(null);

    // Estados para edição
    const [isEditing, setIsEditing] = useState(false);
    const [nomeDisciplina, setNomeDisciplina] = useState('');

    // Estados para adição
    const [isAdding, setIsAdding] = useState(false);
    const [newDisciplinaName, setNewDisciplinaName] = useState('');

    // Carregar os dados ao entrar na tela
    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        console.log("Loading data from api to disciplinas");
        try {
            const response = await api.get("/disciplinas/porInstituicao");

            const data = response.data;
            const disciplinasAgrupadas = [];

            // Lógica de agrupamento (preparada para quando o backend retornar as turmas usando getInfoDisciplinasByInstitution)
            data.forEach(disc => {
                const discExistente = disciplinasAgrupadas.find(e => e.id === disc.id);

                if (discExistente) {
                    if (disc.turma && !discExistente.turmas.includes(disc.turma)) {
                        discExistente.turmas.push(disc.turma);
                    }
                } else {
                    disciplinasAgrupadas.push({
                        id: disc.id,
                        nome: disc.nome,
                        turmas: disc.turma ? [disc.turma] : [],
                        mediaDeAtencao: disc.media_atencao || 0
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

    // --- LÓGICA DE REMOVER ---
    async function handleRemoveDisciplina() {
        if (selectedDisciplina === null) return;

        const disc = disciplinas[selectedDisciplina];
        const confirmacao = window.confirm(`Tem certeza que deseja remover a disciplina ${disc.nome}?`);

        if (confirmacao) {
            try {
                // O backend espera { id } no body
                await api.delete("/disciplinas/excluir", {
                    data: { id: disc.id }
                });

                alert("Disciplina removida com sucesso!");
                setSelectedDisciplina(null);
                setIsEditing(false);
                loadData();
            } catch (error) {
                console.log(error);
                alert("Erro ao remover disciplina.");
            }
        }
    }

    return (
        <div className='disciplinas-body'>
            <Header />
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
                        />
                    ) : (
                        <p className='disciplinas-direita-title'>
                            {disciplinas[selectedDisciplina]?.nome || 'Detalhes da disciplina'}
                        </p>
                    )}

                    <div>
                        {selectedDisciplina !== null && disciplinas[selectedDisciplina] ? (
                            <div className='disciplina-detalhes'>
                                <p><strong>Média de Atenção:</strong> {disciplinas[selectedDisciplina].mediaDeAtencao}%</p>
                                <p><strong>Turmas:</strong> {disciplinas[selectedDisciplina].turmas.join(', ') || 'Nenhuma'}</p>
                            </div>
                        ) : (
                            <p className='disciplina-selecione'>Selecione uma disciplina para ver os detalhes</p>
                        )}
                    </div>

                    <div className='disciplinas-historico-aulas-content'>
                        {/* Conteúdo futuro do gráfico/histórico */}
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
        </div>
    );
}
