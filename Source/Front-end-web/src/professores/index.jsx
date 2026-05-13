import { useNavigate } from 'react-router-dom';
import Header from '../components/header';
import './professores.css';
import { useState } from 'react';

export default function Professores(){
    const professores = [
        { nome: "Ana Paula Souza", email: "ana.souza@escola.com", turmas: ["9A", "9B", "8A"], mediaAtencao: 87.4 },
        { nome: "Carlos Eduardo Lima", email: "carlos.lima@escola.com", turmas: ["7A", "7B"], mediaAtencao: 72.1 },
        { nome: "Fernanda Oliveira", email: "fernanda.oliveira@escola.com", turmas: ["6A", "6B", "6C"], mediaAtencao: 91.3 },
        { nome: "Roberto Mendes", email: "roberto.mendes@escola.com", turmas: ["8B", "9C"], mediaAtencao: 65.8 },
        { nome: "Juliana Costa", email: "juliana.costa@escola.com", turmas: ["7C", "8C", "9A"], mediaAtencao: 83.0 },
        { nome: "Marcos Vinicius Rocha", email: "marcos.rocha@escola.com", turmas: ["6A", "7A"], mediaAtencao: 78.5 },
        { nome: "Patricia Almeida", email: "patricia.almeida@escola.com", turmas: ["8A", "8B", "8C"], mediaAtencao: 95.2 },
    ];

    const [selectedProfessor, setSelectedProfessor] = useState(null);

    return (
        <div className='professores-body'>
            <Header />
            <div className='professores-content'>
                <div className='professores-esquerda'>
                    <p className='professores-esquerda-title'>Lista de professores</p>

                    <div className='professores-list-container'>
                        {professores.map((professor, index) => (
                            <div
                                key={index}
                                className={`professor-item ${selectedProfessor === index ? 'selected' : ''}`}
                                onClick={() => setSelectedProfessor(index)}
                            >
                                {professor.nome}
                            </div>
                        ))}
                    </div>

                    <div>
                        <button className='professores-adicionar'>
                            <p className='professores-adicionar-text'>Adicionar professor</p>
                        </button>
                    </div>
                </div>
                    
                <div className='professores-direita'>
                    <p className='professores-direita-title'>{professores[selectedProfessor]?.nome || 'Detalhes do professor'}</p>   

                    <div>
                        {selectedProfessor !== null ? (
                            <div className='professor-detalhes'>
                                <p><strong>Email:</strong> {professores[selectedProfessor].email}</p>
                                <p><strong>Turmas:</strong> {professores[selectedProfessor].turmas.join(', ')}</p>
                                <p><strong>Média de Atenção:</strong> {professores[selectedProfessor].mediaAtencao}%</p>
                            </div>
                        ) : (
                            <p className='professor-selecione'>Selecione um professor para ver os detalhes</p>
                        )}      
                    </div> 

                    <div className='professores-historico-aulas-content'>
                    
                    </div>

                    <button className='professores-remover'>
                        <p className='professores-remover-text'>Remover professor</p>
                    </button>
                </div>
            </div>
        </div>
    )
}
