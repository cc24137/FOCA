import { useNavigate } from 'react-router-dom';
import Header from '../../components/header';
import './professores.css';
import { useState, useEffect } from 'react';
import api from "../../services/api";

export default function Professores() {
    const navigate = useNavigate();

    const [professores, setProfessores] = useState([]);
    const [selectedProfessor, setSelectedProfessor] = useState(null);

    // Novos estados para a funcionalidade de adicionar professor
    const [isAddingProfessor, setIsAddingProfessor] = useState(false);
    const [newProfessorEmail, setNewProfessorEmail] = useState("");

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        console.log("Loading data from api to professores");
        try {
            const response = await api.get("/professor/infosPorInstituicao");
            const data = response.data;

            const professoresAgrupados = [];

            data.forEach(prof => {
                const professorExistente = professoresAgrupados.find(e => e.id === prof.id);

                const infoTurma = (prof.turma && prof.disciplina)
                    ? `${prof.turma} (${prof.disciplina})`
                    : null;

                if (professorExistente) {
                    if (infoTurma && !professorExistente.turmas.includes(infoTurma)) {
                        professorExistente.turmas.push(infoTurma);
                    }
                } else {
                    professoresAgrupados.push({
                        id: prof.id,
                        nome: prof.nome,
                        email: prof.email,
                        turmas: infoTurma ? [infoTurma] : [],
                        mediaAtencao: prof.media_atencao
                    });
                }
            });

            setProfessores(professoresAgrupados);

        } catch (error) {
            if (error.response) {
                console.log("Erro na API: " + error.response.data.message);
            } else {
                console.log(error);
                alert("Erro de conexão com o servidor.");
            }
        }
    }

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

            alert("Convite enviado com sucesso para o email: " + newProfessorEmail);

            // Limpa os estados
            setNewProfessorEmail("");
            setIsAddingProfessor(false);

        } catch (error) {
            console.log(error);
            alert("Erro ao convidar professor: " + (error.response?.data?.message || "Tente novamente."));
        }
    }

    // remover professor
    async function handleRemoveProfessor() {
        // Verifica se há alguém selecionado
        if (selectedProfessor === null || !professores[selectedProfessor]) return;

        const prof = professores[selectedProfessor];

        // Mostra o alerta de confirmação do navegador
        const confirmacao = window.confirm(`Tem certeza que deseja remover o professor ${prof.nome}?`);

        if (confirmacao) {
            try {
                await api.delete("/instituicao/removerProfessor", {
                    data: { idProfessor: prof.id }
                });

                alert("Professor removido com sucesso!");

                // Tira a seleção do painel da direita e recarrega a lista
                setSelectedProfessor(null);
                loadData();
            } catch (error) {
                console.log(error);
                alert("Erro ao remover professor: " + (error.response?.data?.message || "Tente novamente."));
            }
        }
    }

    return (
        <div className='professores-body'>
            <Header />
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
                                <p><strong>Média de Atenção:</strong> {professores[selectedProfessor].mediaAtencao || 0}%</p>
                            </div>
                        ) : (
                            <p className='professor-selecione'>Selecione um professor para ver os detalhes</p>
                        )}
                    </div>

                    <div className='professores-historico-aulas-content'>

                    </div>

                    {/* Exibe o botão de remover apenas se houver um professor selecionado */}
                    {selectedProfessor !== null && (
                        <button className='professores-remover' onClick={handleRemoveProfessor}>
                            <p className='professores-remover-text'>Remover professor</p>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
